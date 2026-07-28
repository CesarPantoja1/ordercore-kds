from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rol: Mapped[str] = mapped_column(String(20), nullable=False)
    estacion: Mapped[str] = mapped_column(String(20), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    fecha_actualizacion: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    sesiones: Mapped[list["Sesion"]] = relationship(
        "Sesion", back_populates="usuario", lazy="selectin", cascade="all, delete-orphan"
    )
    reset_tokens: Mapped[list["ResetToken"]] = relationship(
        "ResetToken", back_populates="usuario", lazy="selectin", cascade="all, delete-orphan"
    )


class Sesion(Base):
    __tablename__ = "sesiones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("usuarios.id"), nullable=False
    )
    token_jwt: Mapped[str] = mapped_column(String(500), unique=True, nullable=False, index=True)
    activa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    fecha_ultima_actividad: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    fecha_expiracion: Mapped[datetime] = mapped_column(
        DateTime, nullable=False
    )

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="sesiones")


class ResetToken(Base):
    __tablename__ = "reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("usuarios.id"), nullable=False
    )
    token: Mapped[str] = mapped_column(String(500), unique=True, nullable=False, index=True)
    usado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    fecha_expiracion: Mapped[datetime] = mapped_column(
        DateTime, nullable=False
    )

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="reset_tokens")


class ConfiguracionSistema(Base):
    __tablename__ = "configuracion_sistema"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    clave: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    valor: Mapped[str] = mapped_column(Text, nullable=False)
