from datetime import datetime

from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class CatalogoPlato(Base):
    __tablename__ = "catalogo_platos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200), unique=True, nullable=False)
    estacion = Column(String(50), nullable=False)  # Parrilla, Fríos, Bebidas, Postres, General
    descripcion = Column(Text, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    platos_comanda = relationship("PlatoComanda", back_populates="catalogo_plato", lazy="selectin")


class Comanda(Base):
    __tablename__ = "comandas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mesa = Column(Integer, nullable=False)
    comensales = Column(Integer, nullable=False)
    notas_cocina = Column(Text, nullable=True)
    prioridad = Column(String(20), nullable=False, default="Normal")  # Normal, Alta, Urgente
    estado = Column(String(20), nullable=False, default="Activa")  # Activa, Cancelada
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    platos = relationship("PlatoComanda", back_populates="comanda", lazy="selectin", cascade="all, delete-orphan")
    auditorias = relationship("Auditoria", back_populates="comanda", lazy="selectin")


class PlatoComanda(Base):
    __tablename__ = "platos_comanda"

    id = Column(Integer, primary_key=True, autoincrement=True)
    comanda_id = Column(Integer, ForeignKey("comandas.id"), nullable=False)
    catalogo_plato_id = Column(Integer, ForeignKey("catalogo_platos.id"), nullable=False)
    nombre_plato = Column(String(200), nullable=False)
    estacion = Column(String(50), nullable=False)  # Inmutable, asignado desde CatalogoPlato
    estado = Column(String(20), nullable=False, default="En cola")  # En cola, En preparación, Completado, Cancelado
    modificadores = Column(Text, nullable=False, default="[]")  # JSON serializado
    notas = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)

    comanda = relationship("Comanda", back_populates="platos", lazy="selectin")
    catalogo_plato = relationship("CatalogoPlato", back_populates="platos_comanda", lazy="selectin")


class Auditoria(Base):
    __tablename__ = "auditoria_comandas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    usuario_nombre = Column(String(200), nullable=False)
    usuario_rol = Column(String(50), nullable=False)
    tipo_operacion = Column(String(20), nullable=False)  # Creación, Modificación, Cancelación
    comanda_id = Column(Integer, ForeignKey("comandas.id"), nullable=False)
    plato_id = Column(Integer, nullable=True)
    estado_anterior = Column(String(20), nullable=True)
    estado_nuevo = Column(String(20), nullable=False)
    motivo = Column(Text, nullable=True)

    comanda = relationship("Comanda", back_populates="auditorias", lazy="selectin")
