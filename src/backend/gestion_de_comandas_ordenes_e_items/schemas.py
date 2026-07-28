from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class Prioridad(str, Enum):
    NORMAL = "Normal"
    ALTA = "Alta"
    URGENTE = "Urgente"


class EstadoPlato(str, Enum):
    EN_COLA = "En cola"
    EN_PREPARACION = "En preparación"
    COMPLETADO = "Completado"
    CANCELADO = "Cancelado"


class EstadoComanda(str, Enum):
    ACTIVA = "Activa"
    CANCELADA = "Cancelada"


class TipoOperacion(str, Enum):
    CREACION = "Creación"
    MODIFICACION = "Modificación"
    CANCELACION = "Cancelación"


# --- Requests ---

class PlatoCreate(BaseModel):
    catalogo_plato_id: int
    modificadores: Optional[List[str]] = None
    notas: Optional[str] = None


class ComandaCreate(BaseModel):
    mesa: int = Field(..., gt=0)
    comensales: int = Field(..., gt=0)
    platos: List[PlatoCreate] = Field(..., min_length=1)
    notas_cocina: Optional[str] = None
    prioridad: Prioridad = Prioridad.NORMAL


class PlatoUpdate(BaseModel):
    id: Optional[int] = None  # None = nuevo plato
    catalogo_plato_id: int
    modificadores: Optional[List[str]] = None
    notas: Optional[str] = None


class ComandaUpdate(BaseModel):
    mesa: Optional[int] = Field(None, gt=0)
    comensales: Optional[int] = Field(None, gt=0)
    platos: Optional[List[PlatoUpdate]] = None
    notas_cocina: Optional[str] = None
    prioridad: Optional[Prioridad] = None


class CancelRequest(BaseModel):
    motivo: str = Field(..., min_length=10)


# --- Responses ---

class PlatoComandaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    catalogo_plato_id: int
    nombre_plato: str
    estacion: str
    estado: EstadoPlato
    modificadores: List[str]
    notas: Optional[str] = None
    fecha_creacion: datetime


class ComandaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mesa: int
    comensales: int
    platos: List[PlatoComandaOut]
    notas_cocina: Optional[str] = None
    prioridad: Prioridad
    estado: EstadoComanda
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None


class ComandaResumenOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mesa: int
    comensales: int
    platos_count: int
    platos_activos: int
    prioridad: Prioridad
    estado: EstadoComanda
    tiempo_transcurrido: str
    fecha_creacion: datetime


class CatalogoPlatoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    estacion: str
    descripcion: Optional[str] = None
    activo: bool


class AuditoriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    usuario_nombre: str
    usuario_rol: str
    tipo_operacion: TipoOperacion
    comanda_id: int
    plato_id: Optional[int] = None
    estado_anterior: Optional[str] = None
    estado_nuevo: str
    motivo: Optional[str] = None


class AuditoriaListOut(BaseModel):
    total: int
    page: int
    page_size: int
    entries: List[AuditoriaOut]
