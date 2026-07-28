from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db

from .auth_service import (
    DEFAULT_SESSION_TIMEOUT_MINUTES,
    create_access_token,
    decode_token,
    generate_reset_token,
    get_session_timeout_from_config,
    hash_password,
    verify_password,
)
from .dependencies import get_admin_user, get_current_user
from .models import ConfiguracionSistema, ResetToken, Sesion, Usuario
from .schemas import (
    Estacion,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    PaginatedUsers,
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordResetResponse,
    ResetTokenStatus,
    Rol,
    SessionConfigResponse,
    SessionConfigUpdate,
    SetupCompleteRequest,
    SetupCompleteResponse,
    SetupStatusResponse,
    UserActionResponse,
    UserCreate,
    UserOut,
    UserUpdate,
)

router = APIRouter()


# ──────────────────────────────────────────────
# Setup endpoints
# ──────────────────────────────────────────────


@router.get("/auth/setup/status", tags=["Setup"])
async def check_setup_status(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ConfiguracionSistema).where(
            ConfiguracionSistema.clave == "setup_completed"
        )
    )
    config = result.scalar_one_or_none()
    completed = config is not None and config.valor == "true"
    return SetupStatusResponse(setup_completed=completed)


@router.post("/auth/setup/complete", tags=["Setup"])
async def complete_setup(
    body: SetupCompleteRequest,
    db: AsyncSession = Depends(get_db),
):
    # Check if setup already completed
    result = await db.execute(
        select(ConfiguracionSistema).where(
            ConfiguracionSistema.clave == "setup_completed"
        )
    )
    existing = result.scalar_one_or_none()
    if existing is not None and existing.valor == "true":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SETUP_ALREADY_COMPLETED: El asistente de configuración ya fue completado",
        )

    # Check if any admin user already exists
    result = await db.execute(
        select(Usuario).where(
            Usuario.rol.in_(["jefe_cocina", "gerente"]), Usuario.activo.is_(True)
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SETUP_ALREADY_COMPLETED: Ya existe un administrador en el sistema",
        )

    # Validate email uniqueness
    result = await db.execute(
        select(Usuario).where(Usuario.email == body.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="EMAIL_EXISTS: El correo electrónico ya está registrado",
        )

    # Create admin user with role "jefe_cocina"
    new_user = Usuario(
        nombre=body.nombre,
        email=body.email,
        password_hash=hash_password(body.password),
        rol=Rol.JEFE_COCINA.value,
        estacion=Estacion.TODAS.value,
        activo=True,
        fecha_creacion=datetime.utcnow(),
        fecha_actualizacion=datetime.utcnow(),
    )
    db.add(new_user)
    await db.flush()

    # Mark setup as completed
    setup_config = ConfiguracionSistema(
        clave="setup_completed",
        valor="true",
    )
    db.add(setup_config)

    await db.commit()
    await db.refresh(new_user)

    return SetupCompleteResponse(
        message="Configuración inicial completada exitosamente",
        user=UserOut.model_validate(new_user),
    )


# ──────────────────────────────────────────────
# Auth endpoints
# ──────────────────────────────────────────────


@router.post("/auth/login", tags=["Auth"])
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Find user by email
    result = await db.execute(
        select(Usuario).where(Usuario.email == body.email)
    )
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="INVALID_CREDENTIALS: Credenciales inválidas",
        )

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="INVALID_CREDENTIALS: Credenciales inválidas",
        )

    # Check for existing active session
    result = await db.execute(
        select(Sesion).where(
            Sesion.usuario_id == user.id,
            Sesion.activa.is_(True),
        )
    )
    existing_session = result.scalar_one_or_none()
    if existing_session is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SESSION_ALREADY_ACTIVE: Ya existe una sesión activa para este usuario",
        )

    # Get session timeout from config
    result = await db.execute(
        select(ConfiguracionSistema).where(
            ConfiguracionSistema.clave == "session_timeout_minutes"
        )
    )
    config = result.scalar_one_or_none()
    timeout_minutes = (
        get_session_timeout_from_config(config.valor)
        if config
        else DEFAULT_SESSION_TIMEOUT_MINUTES
    )

    expires_delta = timedelta(minutes=timeout_minutes)
    now = datetime.utcnow()

    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=expires_delta,
    )

    # Create session record
    session = Sesion(
        usuario_id=user.id,
        token_jwt=token,
        activa=True,
        fecha_creacion=now,
        fecha_ultima_actividad=now,
        fecha_expiracion=now + expires_delta,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return LoginResponse(
        token=token,
        token_type="bearer",
        expires_in=timeout_minutes * 60,
        user=UserOut.model_validate(user),
    )


@router.post("/auth/logout", tags=["Auth"])
async def logout(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Invalidate current session
    result = await db.execute(
        select(Sesion).where(
            Sesion.usuario_id == current_user.id,
            Sesion.activa.is_(True),
        )
    )
    sessions = result.scalars().all()
    for session in sessions:
        session.activa = False

    await db.commit()
    return LogoutResponse(message="Sesión cerrada exitosamente")


@router.get("/auth/me", tags=["Auth"])
async def get_current_user_endpoint(
    current_user: Usuario = Depends(get_current_user),
):
    return UserOut.model_validate(current_user)


@router.post("/auth/session/refresh", tags=["Auth"])
async def refresh_session(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get session timeout from config
    result = await db.execute(
        select(ConfiguracionSistema).where(
            ConfiguracionSistema.clave == "session_timeout_minutes"
        )
    )
    config = result.scalar_one_or_none()
    timeout_minutes = (
        get_session_timeout_from_config(config.valor)
        if config
        else DEFAULT_SESSION_TIMEOUT_MINUTES
    )

    expires_delta = timedelta(minutes=timeout_minutes)
    now = datetime.utcnow()

    # Invalidate old sessions
    result = await db.execute(
        select(Sesion).where(
            Sesion.usuario_id == current_user.id,
            Sesion.activa.is_(True),
        )
    )
    old_sessions = result.scalars().all()
    for s in old_sessions:
        s.activa = False

    # Create new token and session
    token = create_access_token(
        data={"sub": str(current_user.id)},
        expires_delta=expires_delta,
    )

    new_session = Sesion(
        usuario_id=current_user.id,
        token_jwt=token,
        activa=True,
        fecha_creacion=now,
        fecha_ultima_actividad=now,
        fecha_expiracion=now + expires_delta,
    )
    db.add(new_session)
    await db.commit()

    return LoginResponse(
        token=token,
        token_type="bearer",
        expires_in=timeout_minutes * 60,
        user=UserOut.model_validate(current_user),
    )


# ──────────────────────────────────────────────
# Session Config endpoints (Admin)
# ──────────────────────────────────────────────


@router.get("/auth/session/config", tags=["Admin", "Session"])
async def get_session_config(
    admin_user: Usuario = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ConfiguracionSistema).where(
            ConfiguracionSistema.clave == "session_timeout_minutes"
        )
    )
    config = result.scalar_one_or_none()
    timeout_minutes = (
        get_session_timeout_from_config(config.valor)
        if config
        else DEFAULT_SESSION_TIMEOUT_MINUTES
    )
    return SessionConfigResponse(timeout_minutes=timeout_minutes)


@router.patch("/auth/session/config", tags=["Admin", "Session"])
async def update_session_config(
    body: SessionConfigUpdate,
    admin_user: Usuario = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ConfiguracionSistema).where(
            ConfiguracionSistema.clave == "session_timeout_minutes"
        )
    )
    config = result.scalar_one_or_none()
    if config:
        config.valor = str(body.timeout_minutes)
    else:
        config = ConfiguracionSistema(
            clave="session_timeout_minutes",
            valor=str(body.timeout_minutes),
        )
        db.add(config)

    await db.commit()
    return SessionConfigResponse(timeout_minutes=body.timeout_minutes)


# ──────────────────────────────────────────────
# Password Reset endpoints
# ──────────────────────────────────────────────


@router.post("/auth/recuperar", tags=["Password Reset"])
async def request_password_reset(
    body: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
):
    # Always return the same message for security (prevent email enumeration)
    result = await db.execute(
        select(Usuario).where(Usuario.email == body.email)
    )
    user = result.scalar_one_or_none()

    if user is not None and user.activo:
        # Invalidate any existing unused tokens for this user
        result = await db.execute(
            select(ResetToken).where(
                ResetToken.usuario_id == user.id,
                ResetToken.usado.is_(False),
            )
        )
        old_tokens = result.scalars().all()
        for t in old_tokens:
            t.usado = True

        # Create new reset token (15 min expiry)
        now = datetime.utcnow()
        token_str = generate_reset_token()
        reset_token = ResetToken(
            usuario_id=user.id,
            token=token_str,
            usado=False,
            fecha_creacion=now,
            fecha_expiracion=now + timedelta(minutes=15),
        )
        db.add(reset_token)
        await db.commit()

    return PasswordResetResponse(
        message="Si el correo está registrado, recibirás un enlace para restablecer tu contraseña"
    )


@router.get("/auth/restablecer/{token}", tags=["Password Reset"])
async def verify_reset_token(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ResetToken).where(
            ResetToken.token == token,
            ResetToken.usado.is_(False),
        )
    )
    reset_token = result.scalar_one_or_none()

    if reset_token is None:
        return ResetTokenStatus(valid=False, email=None)

    now = datetime.utcnow()
    if now > reset_token.fecha_expiracion:
        return ResetTokenStatus(valid=False, email=None)

    # Get user email
    user_result = await db.execute(
        select(Usuario).where(Usuario.id == reset_token.usuario_id)
    )
    user = user_result.scalar_one_or_none()
    if user is None or not user.activo:
        return ResetTokenStatus(valid=False, email=None)

    return ResetTokenStatus(valid=True, email=user.email)


@router.post("/auth/restablecer", tags=["Password Reset"])
async def confirm_password_reset(
    body: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ResetToken).where(
            ResetToken.token == body.token,
            ResetToken.usado.is_(False),
        )
    )
    reset_token = result.scalar_one_or_none()

    if reset_token is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_OR_EXPIRED_TOKEN: Token inválido o ya utilizado",
        )

    now = datetime.utcnow()
    if now > reset_token.fecha_expiracion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_OR_EXPIRED_TOKEN: El token ha expirado",
        )

    # Get user
    user_result = await db.execute(
        select(Usuario).where(Usuario.id == reset_token.usuario_id)
    )
    user = user_result.scalar_one_or_none()
    if user is None or not user.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_OR_EXPIRED_TOKEN: Usuario no válido",
        )

    # Update password
    user.password_hash = hash_password(body.password)
    user.fecha_actualizacion = now

    # Invalidate token
    reset_token.usado = True

    # Invalidate all active sessions for this user
    session_result = await db.execute(
        select(Sesion).where(
            Sesion.usuario_id == user.id,
            Sesion.activa.is_(True),
        )
    )
    active_sessions = session_result.scalars().all()
    for s in active_sessions:
        s.activa = False

    await db.commit()

    return PasswordResetResponse(
        message="Contraseña restablecida exitosamente"
    )


# ──────────────────────────────────────────────
# User CRUD endpoints (Admin only)
# ──────────────────────────────────────────────


@router.get("/usuarios", tags=["Admin", "Users"])
async def list_users(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin_user: Usuario = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Usuario).where(Usuario.activo.is_(True))

    if search:
        search_filter = or_(
            Usuario.nombre.ilike(f"%{search}%"),
            Usuario.email.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(Usuario.id).offset(offset).limit(page_size)

    result = await db.execute(query)
    users = result.scalars().all()

    total_pages = max(1, (total + page_size - 1) // page_size)

    return PaginatedUsers(
        items=[UserOut.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/usuarios/{user_id}", tags=["Admin", "Users"])
async def get_user(
    user_id: int,
    admin_user: Usuario = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Usuario).where(Usuario.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND: Usuario no encontrado",
        )
    return UserOut.model_validate(user)


@router.post("/usuarios", tags=["Admin", "Users"])
async def create_user(
    body: UserCreate,
    admin_user: Usuario = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate email uniqueness
    result = await db.execute(
        select(Usuario).where(Usuario.email == body.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="EMAIL_EXISTS: El correo electrónico ya está registrado",
        )

    # Validate role/station constraints
    if body.rol.value in ("jefe_cocina", "gerente") and body.estacion.value != "Todas":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VALIDATION_ERROR: Los roles jefe_cocina y gerente deben tener estación 'Todas'",
        )

    now = datetime.utcnow()
    new_user = Usuario(
        nombre=body.nombre,
        email=body.email,
        password_hash=hash_password(body.password),
        rol=body.rol.value,
        estacion=body.estacion.value,
        activo=True,
        fecha_creacion=now,
        fecha_actualizacion=now,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return UserOut.model_validate(new_user)


@router.patch("/usuarios/{user_id}", tags=["Admin", "Users"])
async def update_user(
    user_id: int,
    body: UserUpdate,
    admin_user: Usuario = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Usuario).where(Usuario.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND: Usuario no encontrado",
        )

    # Validate email uniqueness if changing
    if body.email is not None and body.email != user.email:
        email_result = await db.execute(
            select(Usuario).where(Usuario.email == body.email)
        )
        if email_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="EMAIL_EXISTS: El correo electrónico ya está registrado",
            )
        user.email = body.email

    if body.nombre is not None:
        user.nombre = body.nombre

    if body.password is not None:
        user.password_hash = hash_password(body.password)

    if body.rol is not None:
        user.rol = body.rol.value

    if body.estacion is not None:
        user.estacion = body.estacion.value

    # Validate role/station constraints after update
    if user.rol in ("jefe_cocina", "gerente") and user.estacion != "Todas":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VALIDATION_ERROR: Los roles jefe_cocina y gerente deben tener estación 'Todas'",
        )

    user.fecha_actualizacion = datetime.utcnow()
    await db.commit()
    await db.refresh(user)

    return UserOut.model_validate(user)


@router.patch("/usuarios/{user_id}/deactivate", tags=["Admin", "Users"])
async def deactivate_user(
    user_id: int,
    admin_user: Usuario = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CANNOT_DEACTIVATE_SELF: No puedes desactivar tu propia cuenta",
        )

    result = await db.execute(
        select(Usuario).where(Usuario.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND: Usuario no encontrado",
        )

    user.activo = False
    user.fecha_actualizacion = datetime.utcnow()

    # Invalidate all active sessions for this user
    session_result = await db.execute(
        select(Sesion).where(
            Sesion.usuario_id == user.id,
            Sesion.activa.is_(True),
        )
    )
    for s in session_result.scalars().all():
        s.activa = False

    await db.commit()

    return UserActionResponse(
        message="Usuario desactivado exitosamente",
        user_id=user.id,
    )


@router.patch("/usuarios/{user_id}/reactivate", tags=["Admin", "Users"])
async def reactivate_user(
    user_id: int,
    admin_user: Usuario = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Usuario).where(Usuario.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND: Usuario no encontrado",
        )

    user.activo = True
    user.fecha_actualizacion = datetime.utcnow()
    await db.commit()

    return UserActionResponse(
        message="Usuario reactivado exitosamente",
        user_id=user.id,
    )
