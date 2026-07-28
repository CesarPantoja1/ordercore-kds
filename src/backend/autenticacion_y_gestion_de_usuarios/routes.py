from __future__ import annotations

import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from autenticacion_y_gestion_de_usuarios.auth_service import (
    RESET_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    decode_access_token,
    generate_reset_token,
    get_session_timeout,
    hash_password,
    verify_password,
)
from autenticacion_y_gestion_de_usuarios.dependencies import get_current_user, require_role
from autenticacion_y_gestion_de_usuarios.models import (
    ConfiguracionSistema,
    ResetToken,
    Sesion,
    Usuario,
)
from autenticacion_y_gestion_de_usuarios.schemas import (
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


# --- Setup & Status ---

@router.get("/auth/setup/status", tags=["Auth"])
async def get_setup_status(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ConfiguracionSistema).where(ConfiguracionSistema.clave == "setup_completed")
    )
    config = result.scalars().first()
    completed = config is not None and config.valor.lower() == "true"
    return SetupStatusResponse(setup_completed=completed)


@router.post("/auth/setup/complete", tags=["Auth"])
async def complete_setup(
    body: SetupCompleteRequest,
    db: AsyncSession = Depends(get_db),
):
    # Check if setup already completed
    result = await db.execute(
        select(ConfiguracionSistema).where(ConfiguracionSistema.clave == "setup_completed")
    )
    existing = result.scalars().first()
    if existing is not None and existing.valor.lower() == "true":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SETUP_ALREADY_COMPLETED",
        )

    # Check email uniqueness
    user_result = await db.execute(
        select(Usuario).where(Usuario.email == body.email)
    )
    if user_result.scalars().first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="VALIDATION_ERROR",
        )

    # Create admin user
    user = Usuario(
        nombre=body.nombre,
        email=body.email,
        password_hash=hash_password(body.password),
        rol=Rol.JEFE_COCINA.value,
        estacion=Estacion.TODAS.value,
        activo=True,
        fecha_creacion=datetime.utcnow(),
        fecha_actualizacion=datetime.utcnow(),
    )
    db.add(user)
    await db.flush()

    # Mark setup as completed
    setup_config = ConfiguracionSistema(
        clave="setup_completed",
        valor="true",
    )
    db.add(setup_config)
    await db.commit()
    await db.refresh(user)

    return SetupCompleteResponse(
        message="Configuración inicial completada exitosamente",
        user=UserOut.model_validate(user),
    )


# --- Login ---

@router.post("/auth/login", tags=["Auth"])
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    # Find user by email
    result = await db.execute(
        select(Usuario).where(Usuario.email == body.email)
    )
    user = result.scalars().first()

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="INVALID_CREDENTIALS",
        )

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="INVALID_CREDENTIALS",
        )

    # Check for existing active session
    active_session_result = await db.execute(
        select(Sesion).where(
            Sesion.usuario_id == user.id,
            Sesion.activa == True,
        )
    )
    active_session = active_session_result.scalars().first()
    if active_session is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SESSION_ALREADY_ACTIVE",
        )

    # Get session timeout config
    timeout_config_result = await db.execute(
        select(ConfiguracionSistema).where(
            ConfiguracionSistema.clave == "session_timeout_minutes"
        )
    )
    timeout_config = timeout_config_result.scalars().first()
    timeout_minutes = get_session_timeout(timeout_config.valor if timeout_config else None)

    # Create JWT token
    expires_delta = timedelta(minutes=timeout_minutes)
    token = create_access_token(
        data={"sub": str(user.id), "rol": user.rol},
        expires_delta=expires_delta,
    )

    # Store session
    session = Sesion(
        usuario_id=user.id,
        token_jwt=token,
        activa=True,
        fecha_creacion=datetime.utcnow(),
        fecha_ultima_actividad=datetime.utcnow(),
        fecha_expiracion=datetime.utcnow() + expires_delta,
    )
    db.add(session)
    await db.commit()

    return LoginResponse(
        token=token,
        token_type="bearer",
        expires_in=timeout_minutes * 60,
        user=UserOut.model_validate(user),
    )


# --- Logout ---

@router.post("/auth/logout", tags=["Auth"])
async def logout(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Invalidate all active sessions for this user
    result = await db.execute(
        select(Sesion).where(
            Sesion.usuario_id == current_user.id,
            Sesion.activa == True,
        )
    )
    sessions = result.scalars().all()
    for session in sessions:
        session.activa = False
    await db.commit()

    return LogoutResponse(message="Sesión cerrada exitosamente")


# --- Current User & Session ---

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
    # Get session timeout config
    timeout_config_result = await db.execute(
        select(ConfiguracionSistema).where(
            ConfiguracionSistema.clave == "session_timeout_minutes"
        )
    )
    timeout_config = timeout_config_result.scalars().first()
    timeout_minutes = get_session_timeout(timeout_config.valor if timeout_config else None)

    # Generate new token
    expires_delta = timedelta(minutes=timeout_minutes)
    token = create_access_token(
        data={"sub": str(current_user.id), "rol": current_user.rol},
        expires_delta=expires_delta,
    )

    # Deactivate old sessions
    result = await db.execute(
        select(Sesion).where(
            Sesion.usuario_id == current_user.id,
            Sesion.activa == True,
        )
    )
    old_sessions = result.scalars().all()
    for session in old_sessions:
        session.activa = False

    # Create new session
    new_session = Sesion(
        usuario_id=current_user.id,
        token_jwt=token,
        activa=True,
        fecha_creacion=datetime.utcnow(),
        fecha_ultima_actividad=datetime.utcnow(),
        fecha_expiracion=datetime.utcnow() + expires_delta,
    )
    db.add(new_session)
    await db.commit()

    return LoginResponse(
        token=token,
        token_type="bearer",
        expires_in=timeout_minutes * 60,
        user=UserOut.model_validate(current_user),
    )


# --- Session Config (Admin) ---

@router.get("/auth/session/config", tags=["Admin"])
async def get_session_config(
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_role("jefe_cocina", "gerente")),
):
    result = await db.execute(
        select(ConfiguracionSistema).where(
            ConfiguracionSistema.clave == "session_timeout_minutes"
        )
    )
    config = result.scalars().first()
    timeout = get_session_timeout(config.valor if config else None)
    return SessionConfigResponse(timeout_minutes=timeout)


@router.patch("/auth/session/config", tags=["Admin"])
async def update_session_config(
    body: SessionConfigUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_role("jefe_cocina", "gerente")),
):
    result = await db.execute(
        select(ConfiguracionSistema).where(
            ConfiguracionSistema.clave == "session_timeout_minutes"
        )
    )
    config = result.scalars().first()
    if config is None:
        config = ConfiguracionSistema(
            clave="session_timeout_minutes",
            valor=str(body.timeout_minutes),
        )
        db.add(config)
    else:
        config.valor = str(body.timeout_minutes)
    await db.commit()
    return SessionConfigResponse(timeout_minutes=body.timeout_minutes)


# --- Password Reset ---

@router.post("/auth/recuperar", tags=["Auth"])
async def request_password_reset(
    body: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
):
    # Always return success to prevent email enumeration
    result = await db.execute(
        select(Usuario).where(Usuario.email == body.email)
    )
    user = result.scalars().first()

    if user is not None and user.activo:
        # Invalidate any existing unused tokens for this user
        old_tokens_result = await db.execute(
            select(ResetToken).where(
                ResetToken.usuario_id == user.id,
                ResetToken.usado == False,
            )
        )
        old_tokens = old_tokens_result.scalars().all()
        for old_token in old_tokens:
            old_token.usado = True

        # Generate new token
        token_value = generate_reset_token()
        reset_token = ResetToken(
            usuario_id=user.id,
            token=token_value,
            usado=False,
            fecha_creacion=datetime.utcnow(),
            fecha_expiracion=datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
        )
        db.add(reset_token)
        await db.commit()

    return PasswordResetResponse(
        message="Si el correo está registrado, recibirás un enlace para restablecer tu contraseña"
    )


@router.get("/auth/restablecer/{token}", tags=["Auth"])
async def verify_reset_token(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ResetToken).options(selectinload(ResetToken.usuario)).where(
            ResetToken.token == token,
            ResetToken.usado == False,
        )
    )
    reset_token = result.scalars().first()

    if reset_token is None:
        return ResetTokenStatus(valid=False)

    if reset_token.fecha_expiracion < datetime.utcnow():
        return ResetTokenStatus(valid=False)

    return ResetTokenStatus(
        valid=True,
        email=reset_token.usuario.email,
    )


@router.post("/auth/restablecer", tags=["Auth"])
async def reset_password(
    body: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ResetToken).options(selectinload(ResetToken.usuario)).where(
            ResetToken.token == body.token,
            ResetToken.usado == False,
        )
    )
    reset_token = result.scalars().first()

    if reset_token is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_OR_EXPIRED_TOKEN",
        )

    if reset_token.fecha_expiracion < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_OR_EXPIRED_TOKEN",
        )

    # Update password
    user = reset_token.usuario
    user.password_hash = hash_password(body.password)
    user.fecha_actualizacion = datetime.utcnow()

    # Invalidate token
    reset_token.usado = True

    # Invalidate all active sessions for this user
    sessions_result = await db.execute(
        select(Sesion).where(
            Sesion.usuario_id == user.id,
            Sesion.activa == True,
        )
    )
    active_sessions = sessions_result.scalars().all()
    for session in active_sessions:
        session.activa = False

    await db.commit()

    return PasswordResetResponse(
        message="Contraseña restablecida exitosamente"
    )


# --- User CRUD (Admin) ---

@router.get("/usuarios", tags=["Admin"])
async def list_users(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_role("jefe_cocina", "gerente")),
):
    query = select(Usuario).where(Usuario.activo == True)

    if search:
        query = query.where(
            Usuario.nombre.ilike(f"%{search}%") | Usuario.email.ilike(f"%{search}%")
        )

    # Total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Pagination
    offset = (page - 1) * page_size
    query = query.order_by(Usuario.id).offset(offset).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size

    return PaginatedUsers(
        items=[UserOut.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/usuarios/{user_id}", tags=["Admin"])
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_role("jefe_cocina", "gerente")),
):
    result = await db.execute(
        select(Usuario).where(Usuario.id == user_id)
    )
    user = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND",
        )
    return UserOut.model_validate(user)


@router.post("/usuarios", tags=["Admin"])
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_role("jefe_cocina", "gerente")),
):
    # Check email uniqueness
    existing_result = await db.execute(
        select(Usuario).where(Usuario.email == body.email)
    )
    if existing_result.scalars().first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="EMAIL_EXISTS",
        )

    # Validate station based on role
    if body.rol in (Rol.JEFE_COCINA, Rol.GERENTE) and body.estacion != Estacion.TODAS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VALIDATION_ERROR",
        )

    user = Usuario(
        nombre=body.nombre,
        email=body.email,
        password_hash=hash_password(body.password),
        rol=body.rol.value,
        estacion=body.estacion.value,
        activo=True,
        fecha_creacion=datetime.utcnow(),
        fecha_actualizacion=datetime.utcnow(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserOut.model_validate(user)


@router.patch("/usuarios/{user_id}", tags=["Admin"])
async def update_user(
    user_id: int,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_role("jefe_cocina", "gerente")),
):
    result = await db.execute(
        select(Usuario).where(Usuario.id == user_id)
    )
    user = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND",
        )

    # Check email uniqueness if changing email
    if body.email is not None and body.email != user.email:
        email_result = await db.execute(
            select(Usuario).where(Usuario.email == body.email)
        )
        if email_result.scalars().first() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="EMAIL_EXISTS",
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

    user.fecha_actualizacion = datetime.utcnow()
    await db.commit()
    await db.refresh(user)

    return UserOut.model_validate(user)


@router.patch("/usuarios/{user_id}/deactivate", tags=["Admin"])
async def deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_role("jefe_cocina", "gerente")),
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CANNOT_DEACTIVATE_SELF",
        )

    result = await db.execute(
        select(Usuario).where(Usuario.id == user_id)
    )
    user = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND",
        )

    user.activo = False
    user.fecha_actualizacion = datetime.utcnow()

    # Invalidate all active sessions
    sessions_result = await db.execute(
        select(Sesion).where(
            Sesion.usuario_id == user.id,
            Sesion.activa == True,
        )
    )
    sessions = sessions_result.scalars().all()
    for session in sessions:
        session.activa = False

    # Invalidate all pending reset tokens
    tokens_result = await db.execute(
        select(ResetToken).where(
            ResetToken.usuario_id == user.id,
            ResetToken.usado == False,
        )
    )
    tokens = tokens_result.scalars().all()
    for token in tokens:
        token.usado = True

    await db.commit()

    return UserActionResponse(
        message="Usuario desactivado exitosamente",
        user_id=user.id,
    )


@router.patch("/usuarios/{user_id}/reactivate", tags=["Admin"])
async def reactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_role("jefe_cocina", "gerente")),
):
    result = await db.execute(
        select(Usuario).where(Usuario.id == user_id)
    )
    user = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND",
        )

    user.activo = True
    user.fecha_actualizacion = datetime.utcnow()
    await db.commit()

    return UserActionResponse(
        message="Usuario reactivado exitosamente",
        user_id=user.id,
    )
