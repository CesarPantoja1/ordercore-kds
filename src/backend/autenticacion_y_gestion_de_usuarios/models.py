from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(50), nullable=False)
    estacion = Column(String(50), nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    sesiones = relationship("Sesion", back_populates="usuario", lazy="selectin")
    reset_tokens = relationship("ResetToken", back_populates="usuario", lazy="selectin")


class Sesion(Base):
    __tablename__ = "sesiones"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    token_jwt = Column(String(500), unique=True, nullable=False, index=True)
    activa = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_ultima_actividad = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_expiracion = Column(DateTime, nullable=False)

    usuario = relationship("Usuario", back_populates="sesiones")


class ResetToken(Base):
    __tablename__ = "reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    token = Column(String(500), unique=True, nullable=False, index=True)
    usado = Column(Boolean, default=False, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_expiracion = Column(DateTime, nullable=False)

    usuario = relationship("Usuario", back_populates="reset_tokens")


class ConfiguracionSistema(Base):
    __tablename__ = "configuracion_sistema"

    id = Column(Integer, primary_key=True, index=True)
    clave = Column(String(100), unique=True, nullable=False, index=True)
    valor = Column(String(500), nullable=False)
