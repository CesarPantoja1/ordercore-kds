from datetime import datetime

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from autenticacion_y_gestion_de_usuarios.models import Sesion, Usuario
from autenticacion_y_gestion_de_usuarios.auth_service import decode_access_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="UNAUTHORIZED",
        )
    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="UNAUTHORIZED",
        )
    try:
        user_id = int(sub)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="UNAUTHORIZED",
        )

    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.sesiones)).where(Usuario.id == user_id)
    )
    user = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="UNAUTHORIZED",
        )
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="USER_DEACTIVATED",
        )

    # Verify session is still active
    session_result = await db.execute(
        select(Sesion).where(
            Sesion.usuario_id == user.id,
            Sesion.token_jwt == token,
            Sesion.activa == True,
        )
    )
    session = session_result.scalars().first()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="UNAUTHORIZED",
        )

    # Update last activity
    session.fecha_ultima_actividad = datetime.utcnow()
    await db.commit()

    return user


def require_role(*roles: str):
    """Dependency factory that checks if the current user has one of the allowed roles."""

    async def role_checker(
        current_user: Usuario = Depends(get_current_user),
    ) -> Usuario:
        if current_user.rol not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="FORBIDDEN",
            )
        return current_user

    return role_checker
