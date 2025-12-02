from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import Base, engine
from .routes import (
    auth_router,
    cartridges_router,
    game_router,
    stats_router,
    hunters_router
)

# Créer les tables (pour le développement, utiliser Alembic en production)
Base.metadata.create_all(bind=engine)

# Créer l'application FastAPI
app = FastAPI(
    title="Chasse App API",
    description="API de gestion de chasse - cartouches, gibiers et statistiques",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enregistrer les routes
app.include_router(auth_router)
app.include_router(cartridges_router)
app.include_router(game_router)
app.include_router(stats_router)
app.include_router(hunters_router)


@app.get("/")
def root():
    """Endpoint racine"""
    return {
        "message": "Bienvenue sur l'API Chasse App",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Vérification de santé de l'API"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
