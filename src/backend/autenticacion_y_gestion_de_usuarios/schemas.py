import enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# --- Enumerations ---

class Rol(str, enum.Enum):
    JEFE_COCINA = "jefe_cocina"
    COCINERO = "cocinero"
    GERENTE = "gerente"


class Estacion(str, enum.Enum):
    PARRILLA = "Parrilla"
    FRIOS = "Fríos"
    BEBIDAS = "Bebidas"
    POSTRES = "Postres"
    TODAS = "Todas"


# --- Request Schemas ---

class SetupCompleteRequest(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    email: str = Field(
        ...,
        pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    )
    password: str = Field(..., min_length=8, max_length=72)


class LoginRequest(BaseModel):
    email: str
    password: str


class UserCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    email: str
    password: str = Field(..., min_length=8, max_length=72)
    rol: Rol
    estacion: Estacion


class UserUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8, max_length=72)
    rol: Optional[Rol] = None
    estacion: Optional[Estacion] = None


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    password: str = Field(..., min_length=8, max_length=72)


class SessionConfigUpdate(BaseModel):
    timeout_minutes: int = Field(..., ge=1, le=120)


# --- Response Schemas ---

class UserOut(BaseModel):
    id: int
    nombre: str
    email: str
    rol: Rol
    estacion: Estacion
    activo: bool

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class PaginatedUsers(BaseModel):
    items: List[UserOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class SetupStatusResponse(BaseModel):
    setup_completed: bool


class SetupCompleteResponse(BaseModel):
    message: str
    user: UserOut


class LogoutResponse(BaseModel):
    message: str


class PasswordResetResponse(BaseModel):
    message: str


class ResetTokenStatus(BaseModel):
    valid: bool
    email: Optional[str] = None


class UserActionResponse(BaseModel):
    message: str
    user_id: int


class SessionConfigResponse(BaseModel):
    timeout_minutes: int
