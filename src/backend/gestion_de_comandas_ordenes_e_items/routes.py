import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db

from .dependencies import get_current_user, require_roles
from .models import Auditoria, CatalogoPlato, Comanda, PlatoComanda
from .schemas import (
    AuditoriaListOut,
    AuditoriaOut,
    CancelRequest,
    CatalogoPlatoOut,
    ComandaCreate,
    ComandaOut,
    ComandaResumenOut,
    ComandaUpdate,
    EstadoComanda,
    EstadoPlato,
    PlatoComandaOut,
    Prioridad,
    TipoOperacion,
)

router = APIRouter()


# ──────────────────────────────────────────────
# Helper functions
# ──────────────────────────────────────────────


async def _load_comanda_full(comanda_id: int, db: AsyncSession) -> Comanda:
    """Load a comanda with all relationships eagerly."""
    result = await db.execute(
        select(Comanda)
        .options(
            selectinload(Comanda.platos).selectinload(PlatoComanda.catalogo_plato),
            selectinload(Comanda.auditorias),
        )
        .where(Comanda.id == comanda_id)
    )
    comanda = result.scalar_one_or_none()
    if comanda is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND: Comanda no encontrada",
        )
    return comanda


def _serialize_modificadores(mods: Optional[List[str]]) -> str:
    """Serialize modificadores list to JSON string."""
    return json.dumps(mods or [], ensure_ascii=False)


def _deserialize_modificadores(mods_str: str) -> List[str]:
    """Deserialize modificadores JSON string to list."""
    if not mods_str:
        return []
    try:
        return json.loads(mods_str)
    except (json.JSONDecodeError, TypeError):
        return []


def _compute_tiempo_transcurrido(fecha_creacion: datetime) -> str:
    """Compute elapsed time string from creation timestamp."""
    now = datetime.utcnow()
    diff = now - fecha_creacion
    total_minutes = int(diff.total_seconds() // 60)
    if total_minutes < 1:
        return "Menos de 1 min"
    hours = total_minutes // 60
    minutes = total_minutes % 60
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


def _plato_to_out(plato: PlatoComanda) -> dict:
    """Convert a PlatoComanda ORM object to a dict matching PlatoComandaOut."""
    return {
        "id": plato.id,
        "catalogo_plato_id": plato.catalogo_plato_id,
        "nombre_plato": plato.nombre_plato,
        "estacion": plato.estacion,
        "estado": plato.estado,
        "modificadores": _deserialize_modificadores(plato.modificadores),
        "notas": plato.notas,
        "fecha_creacion": plato.fecha_creacion,
    }


async def _registrar_auditoria(
    db: AsyncSession,
    usuario,
    tipo_operacion: str,
    comanda_id: int,
    estado_nuevo: str,
    plato_id: Optional[int] = None,
    estado_anterior: Optional[str] = None,
    motivo: Optional[str] = None,
):
    """Create an immutable audit entry."""
    entry = Auditoria(
        timestamp=datetime.utcnow(),
        usuario_id=usuario.id,
        usuario_nombre=usuario.nombre,
        usuario_rol=usuario.rol,
        tipo_operacion=tipo_operacion,
        comanda_id=comanda_id,
        plato_id=plato_id,
        estado_anterior=estado_anterior,
        estado_nuevo=estado_nuevo,
        motivo=motivo,
    )
    db.add(entry)


# ──────────────────────────────────────────────
# Create Comanda
# ──────────────────────────────────────────────


@router.post("/", tags=["Comandas"])
async def create_comanda(
    body: ComandaCreate,
    current_user=Depends(require_roles(["jefe_cocina", "cocinero", "gerente", "mesero"])),
    db: AsyncSession = Depends(get_db),
):
    """Create a new comanda with platos."""
    # Validate platos exist in catalog
    for plato_in in body.platos:
        result = await db.execute(
            select(CatalogoPlato).where(CatalogoPlato.id == plato_in.catalogo_plato_id)
        )
        catalogo = result.scalar_one_or_none()
        if catalogo is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"PLATO_NOT_FOUND: Plato con id {plato_in.catalogo_plato_id} no encontrado en catálogo",
            )
        if not catalogo.activo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"PLATO_INACTIVE: Plato '{catalogo.nombre}' no está activo en el catálogo",
            )

    # Create comanda
    now = datetime.utcnow()
    comanda = Comanda(
        mesa=body.mesa,
        comensales=body.comensales,
        notas_cocina=body.notas_cocina,
        prioridad=body.prioridad.value,
        estado=EstadoComanda.ACTIVA.value,
        fecha_creacion=now,
        fecha_actualizacion=now,
    )
    db.add(comanda)
    await db.flush()

    # Create platos
    for plato_in in body.platos:
        result = await db.execute(
            select(CatalogoPlato).where(CatalogoPlato.id == plato_in.catalogo_plato_id)
        )
        catalogo = result.scalar_one()

        plato = PlatoComanda(
            comanda_id=comanda.id,
            catalogo_plato_id=plato_in.catalogo_plato_id,
            nombre_plato=catalogo.nombre,
            estacion=catalogo.estacion,
            estado=EstadoPlato.EN_COLA.value,
            modificadores=_serialize_modificadores(plato_in.modificadores),
            notas=plato_in.notas,
            fecha_creacion=now,
        )
        db.add(plato)

    await db.flush()

    # Register audit entry
    await _registrar_auditoria(
        db=db,
        usuario=current_user,
        tipo_operacion=TipoOperacion.CREACION.value,
        comanda_id=comanda.id,
        estado_nuevo=EstadoComanda.ACTIVA.value,
    )

    await db.commit()
    await db.refresh(comanda)

    # Reload with relationships
    comanda = await _load_comanda_full(comanda.id, db)

    return ComandaOut(
        id=comanda.id,
        mesa=comanda.mesa,
        comensales=comanda.comensales,
        platos=[PlatoComandaOut(**_plato_to_out(p)) for p in comanda.platos],
        notas_cocina=comanda.notas_cocina,
        prioridad=comanda.prioridad,
        estado=comanda.estado,
        fecha_creacion=comanda.fecha_creacion,
        fecha_actualizacion=comanda.fecha_actualizacion,
    )


# ──────────────────────────────────────────────
# List Comandas
# ──────────────────────────────────────────────


@router.get("/", tags=["Comandas"])
async def list_comandas(
    estacion: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List active comandas. Filtered by estacion for cocineros."""
    is_cocinero = current_user.rol == "cocinero"
    is_jefe = current_user.rol == "jefe_cocina"
    is_gerente = current_user.rol == "gerente"

    # Build base query
    query = (
        select(Comanda)
        .options(
            selectinload(Comanda.platos).selectinload(PlatoComanda.catalogo_plato),
        )
        .where(Comanda.estado == EstadoComanda.ACTIVA.value)
    )

    # Apply station filter
    if is_cocinero:
        # Only show platos assigned to this user's station
        user_estacion = current_user.estacion
        if user_estacion == "Todas":
            pass  # Show all
        else:
            query = query.join(Comanda.platos).where(
                PlatoComanda.estacion == user_estacion
            )
            query = query.distinct()
    elif estacion and (is_jefe or is_gerente):
        query = query.join(Comanda.platos).where(
            PlatoComanda.estacion == estacion
        )
        query = query.distinct()

    # Order by priority (Urgente > Alta > Normal) then by creation time (FIFO)
    priority_order = func.case(
        (Comanda.prioridad == "Urgente", 0),
        (Comanda.prioridad == "Alta", 1),
        else_=2,
    )
    query = query.order_by(priority_order, Comanda.fecha_creacion.asc())

    result = await db.execute(query)
    comandas = result.scalars().all()

    response = []
    for comanda in comandas:
        platos_activos = sum(
            1 for p in comanda.platos if p.estado in (
                EstadoPlato.EN_COLA.value,
                EstadoPlato.EN_PREPARACION.value,
            )
        )
        response.append(
            ComandaResumenOut(
                id=comanda.id,
                mesa=comanda.mesa,
                comensales=comanda.comensales,
                platos_count=len(comanda.platos),
                platos_activos=platos_activos,
                prioridad=comanda.prioridad,
                estado=comanda.estado,
                tiempo_transcurrido=_compute_tiempo_transcurrido(comanda.fecha_creacion),
                fecha_creacion=comanda.fecha_creacion,
            )
        )

    return response


# ──────────────────────────────────────────────
# Get Comanda detail
# ──────────────────────────────────────────────


@router.get("/{comanda_id}", tags=["Comandas"])
async def get_comanda(
    comanda_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed info for a specific comanda."""
    comanda = await _load_comanda_full(comanda_id, db)

    # If cocinero (not jefe/gerente), check they have platos assigned to their station
    if current_user.rol == "cocinero" and current_user.estacion != "Todas":
        user_estacion = current_user.estacion
        has_platos = any(p.estacion == user_estacion for p in comanda.platos)
        if not has_platos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="FORBIDDEN: No tienes platos asignados en esta comanda",
            )

    return ComandaOut(
        id=comanda.id,
        mesa=comanda.mesa,
        comensales=comanda.comensales,
        platos=[PlatoComandaOut(**_plato_to_out(p)) for p in comanda.platos],
        notas_cocina=comanda.notas_cocina,
        prioridad=comanda.prioridad,
        estado=comanda.estado,
        fecha_creacion=comanda.fecha_creacion,
        fecha_actualizacion=comanda.fecha_actualizacion,
    )


# ──────────────────────────────────────────────
# Update Comanda
# ──────────────────────────────────────────────


@router.put("/{comanda_id}", tags=["Comandas"])
async def update_comanda(
    comanda_id: int,
    body: ComandaUpdate,
    current_user=Depends(require_roles(["jefe_cocina", "mesero"])),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing comanda. Only platos in 'En cola' state can be modified."""
    comanda = await _load_comanda_full(comanda_id, db)

    if comanda.estado == EstadoComanda.CANCELADA.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="COMANDO_CANCELADA: No se puede modificar una comanda cancelada",
        )

    is_jefe = current_user.rol == "jefe_cocina"

    # mesa and comensales restricted to Jefe de Cocina only
    if body.mesa is not None:
        if not is_jefe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MESA_RESTRICTED: Solo Jefe de Cocina puede modificar el número de mesa",
            )
        comanda.mesa = body.mesa

    if body.comensales is not None:
        if not is_jefe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MESA_RESTRICTED: Solo Jefe de Cocina puede modificar la cantidad de comensales",
            )
        comanda.comensales = body.comensales

    if body.notas_cocina is not None:
        comanda.notas_cocina = body.notas_cocina

    if body.prioridad is not None:
        comanda.prioridad = body.prioridad.value

    # Handle platos updates
    if body.platos is not None:
        existing_platos = {p.id: p for p in comanda.platos}

        for plato_update in body.platos:
            if plato_update.id is not None and plato_update.id in existing_platos:
                # Existing plato - check it's in "En cola" state
                plato = existing_platos[plato_update.id]
                if plato.estado != EstadoPlato.EN_COLA.value:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"PLATO_IN_PREPARACION: Plato {plato_update.id} ya inició preparación (estado: {plato.estado})",
                    )
                # Update fields
                if plato_update.catalogo_plato_id != plato.catalogo_plato_id:
                    # Re-catalog assignment - update name/station
                    result = await db.execute(
                        select(CatalogoPlato).where(
                            CatalogoPlato.id == plato_update.catalogo_plato_id
                        )
                    )
                    catalogo = result.scalar_one_or_none()
                    if catalogo is None or not catalogo.activo:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"PLATO_NOT_FOUND: Catálogo plato {plato_update.catalogo_plato_id} inválido",
                        )
                    plato.catalogo_plato_id = plato_update.catalogo_plato_id
                    plato.nombre_plato = catalogo.nombre
                    plato.estacion = catalogo.estacion

                if plato_update.modificadores is not None:
                    plato.modificadores = _serialize_modificadores(plato_update.modificadores)
                if plato_update.notas is not None:
                    plato.notas = plato_update.notas

                # Remove from dict to track which were deleted
                del existing_platos[plato_update.id]

            else:
                # New plato
                result = await db.execute(
                    select(CatalogoPlato).where(
                        CatalogoPlato.id == plato_update.catalogo_plato_id
                    )
                )
                catalogo = result.scalar_one_or_none()
                if catalogo is None or not catalogo.activo:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"PLATO_INVALID: Catálogo plato {plato_update.catalogo_plato_id} inválido",
                    )
                new_plato = PlatoComanda(
                    comanda_id=comanda.id,
                    catalogo_plato_id=plato_update.catalogo_plato_id,
                    nombre_plato=catalogo.nombre,
                    estacion=catalogo.estacion,
                    estado=EstadoPlato.EN_COLA.value,
                    modificadores=_serialize_modificadores(plato_update.modificadores),
                    notas=plato_update.notas,
                    fecha_creacion=datetime.utcnow(),
                )
                db.add(new_plato)

        # Delete platos that were removed (only if in "En cola")
        for plato_id, plato in existing_platos.items():
            if plato.estado == EstadoPlato.EN_COLA.value:
                await db.delete(plato)
            # If not in "En cola", keep it (can't delete)

    comanda.fecha_actualizacion = datetime.utcnow()

    # Register audit entry
    await _registrar_auditoria(
        db=db,
        usuario=current_user,
        tipo_operacion=TipoOperacion.MODIFICACION.value,
        comanda_id=comanda.id,
        estado_nuevo=comanda.estado,
    )

    await db.commit()
    await db.refresh(comanda)

    # Reload with relationships
    comanda = await _load_comanda_full(comanda.id, db)

    return ComandaOut(
        id=comanda.id,
        mesa=comanda.mesa,
        comensales=comanda.comensales,
        platos=[PlatoComandaOut(**_plato_to_out(p)) for p in comanda.platos],
        notas_cocina=comanda.notas_cocina,
        prioridad=comanda.prioridad,
        estado=comanda.estado,
        fecha_creacion=comanda.fecha_creacion,
        fecha_actualizacion=comanda.fecha_actualizacion,
    )


# ──────────────────────────────────────────────
# Cancel Comanda (full order)
# ──────────────────────────────────────────────


@router.patch("/{comanda_id}/cancel", tags=["Comandas"])
async def cancel_comanda(
    comanda_id: int,
    body: CancelRequest,
    current_user=Depends(require_roles(["jefe_cocina", "gerente"])),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a full comanda. All platos are set to 'Cancelado'."""
    comanda = await _load_comanda_full(comanda_id, db)

    if comanda.estado == EstadoComanda.CANCELADA.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="COMANDO_YA_CANCELADA: La comanda ya está cancelada",
        )

    # Set all platos to Cancelado
    for plato in comanda.platos:
        estado_anterior = plato.estado
        if plato.estado != EstadoPlato.CANCELADO.value:
            plato.estado = EstadoPlato.CANCELADO.value
            await _registrar_auditoria(
                db=db,
                usuario=current_user,
                tipo_operacion=TipoOperacion.CANCELACION.value,
                comanda_id=comanda.id,
                plato_id=plato.id,
                estado_anterior=estado_anterior,
                estado_nuevo=EstadoPlato.CANCELADO.value,
                motivo=body.motivo,
            )

    comanda.estado = EstadoComanda.CANCELADA.value
    comanda.fecha_actualizacion = datetime.utcnow()

    # Register full comanda cancellation audit
    await _registrar_auditoria(
        db=db,
        usuario=current_user,
        tipo_operacion=TipoOperacion.CANCELACION.value,
        comanda_id=comanda.id,
        estado_anterior=EstadoComanda.ACTIVA.value,
        estado_nuevo=EstadoComanda.CANCELADA.value,
        motivo=body.motivo,
    )

    await db.commit()
    await db.refresh(comanda)

    comanda = await _load_comanda_full(comanda.id, db)

    return ComandaOut(
        id=comanda.id,
        mesa=comanda.mesa,
        comensales=comanda.comensales,
        platos=[PlatoComandaOut(**_plato_to_out(p)) for p in comanda.platos],
        notas_cocina=comanda.notas_cocina,
        prioridad=comanda.prioridad,
        estado=comanda.estado,
        fecha_creacion=comanda.fecha_creacion,
        fecha_actualizacion=comanda.fecha_actualizacion,
    )


# ──────────────────────────────────────────────
# Cancel individual Plato
# ──────────────────────────────────────────────


@router.patch("/{comanda_id}/platos/{plato_id}/cancel", tags=["Comandas"])
async def cancel_plato(
    comanda_id: int,
    plato_id: int,
    body: CancelRequest,
    current_user=Depends(require_roles(["jefe_cocina", "gerente"])),
    db: AsyncSession = Depends(get_db),
):
    """Cancel an individual plato within a comanda."""
    comanda = await _load_comanda_full(comanda_id, db)

    # Find the plato
    plato = None
    for p in comanda.platos:
        if p.id == plato_id:
            plato = p
            break

    if plato is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND: Plato no encontrado en esta comanda",
        )

    if plato.estado == EstadoPlato.CANCELADO.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PLATO_YA_CANCELADO: El plato ya está cancelado",
        )

    estado_anterior = plato.estado
    plato.estado = EstadoPlato.CANCELADO.value
    comanda.fecha_actualizacion = datetime.utcnow()

    # Register audit entry
    await _registrar_auditoria(
        db=db,
        usuario=current_user,
        tipo_operacion=TipoOperacion.CANCELACION.value,
        comanda_id=comanda.id,
        plato_id=plato.id,
        estado_anterior=estado_anterior,
        estado_nuevo=EstadoPlato.CANCELADO.value,
        motivo=body.motivo,
    )

    await db.commit()

    return PlatoComandaOut(
        id=plato.id,
        catalogo_plato_id=plato.catalogo_plato_id,
        nombre_plato=plato.nombre_plato,
        estacion=plato.estacion,
        estado=plato.estado,
        modificadores=_deserialize_modificadores(plato.modificadores),
        notas=plato.notas,
        fecha_creacion=plato.fecha_creacion,
    )


# ──────────────────────────────────────────────
# Auditing: Get audit log
# ──────────────────────────────────────────────


@router.get("/auditoria", tags=["Auditoria"])
async def get_auditoria(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    comanda_id: Optional[int] = Query(None),
    usuario: Optional[str] = Query(None),
    tipo_operacion: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(require_roles(["gerente"])),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated audit log entries. Only accessible by Gerente."""
    query = select(Auditoria)

    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            query = query.where(Auditoria.timestamp >= dt_from)
        except ValueError:
            pass

    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to)
            query = query.where(Auditoria.timestamp <= dt_to)
        except ValueError:
            pass

    if comanda_id is not None:
        query = query.where(Auditoria.comanda_id == comanda_id)

    if usuario:
        query = query.where(Auditoria.usuario_nombre.ilike(f"%{usuario}%"))

    if tipo_operacion:
        query = query.where(Auditoria.tipo_operacion == tipo_operacion)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Order by timestamp desc (most recent first)
    query = query.order_by(Auditoria.timestamp.desc())

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    entries = result.scalars().all()

    return AuditoriaListOut(
        total=total,
        page=page,
        page_size=page_size,
        entries=[AuditoriaOut.model_validate(e) for e in entries],
    )


# ──────────────────────────────────────────────
# Catalog: List platos
# ──────────────────────────────────────────────


@router.get("/catalogo/platos", tags=["Catalogo"])
async def get_catalogo_platos(
    estacion: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List platos from the catalog, optionally filtered by station or search."""
    query = select(CatalogoPlato).where(CatalogoPlato.activo.is_(True))

    if estacion:
        query = query.where(CatalogoPlato.estacion == estacion)

    if search:
        query = query.where(CatalogoPlato.nombre.ilike(f"%{search}%"))

    query = query.order_by(CatalogoPlato.nombre.asc())

    result = await db.execute(query)
    platos = result.scalars().all()

    return [CatalogoPlatoOut.model_validate(p) for p in platos]
