from .auth import router as auth_router
from .cartridges import router as cartridges_router
from .game import router as game_router
from .stats import router as stats_router
from .hunters import router as hunters_router

__all__ = [
    "auth_router",
    "cartridges_router",
    "game_router",
    "stats_router",
    "hunters_router",
]
