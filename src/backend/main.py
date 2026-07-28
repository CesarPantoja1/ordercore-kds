from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine

from autenticacion_y_gestion_de_usuarios.routes import router as auth_router
from gestion_de_comandas_ordenes_e_items.routes import router as comandas_router

app = FastAPI(title="OrderCore KDS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/autenticacion_y_gestion_de_usuarios")
app.include_router(comandas_router, prefix="/api/gestion_de_comandas_ordenes_e_items")


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
