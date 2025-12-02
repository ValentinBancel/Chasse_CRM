from pydantic import BaseModel
from typing import List, Dict, Optional
from uuid import UUID


class HunterStatsResponse(BaseModel):
    """Statistiques par chasseur"""
    hunter_id: UUID
    hunter_name: str
    total_games: int
    total_cartridges_used: int
    total_cartridges_purchased: int
    total_spent: float
    efficiency_ratio: float  # Cartouches / Gibier
    games_by_species: Dict[str, int]  # {espèce: nombre}


class SpeciesStatsResponse(BaseModel):
    """Statistiques par espèce"""
    species_name: str
    total_killed: int
    average_cartridges_per_kill: float
    hunters_count: int  # Nombre de chasseurs ayant tué cette espèce


class SeasonStatsResponse(BaseModel):
    """Statistiques par saison"""
    season_name: str
    year_start: int
    total_games: int
    total_cartridges_used: int
    hunters_stats: List[HunterStatsResponse]
    species_stats: List[SpeciesStatsResponse]


class EfficiencyStatsResponse(BaseModel):
    """Statistiques d'efficacité"""
    hunter_id: UUID
    hunter_name: str
    total_cartridges: int
    total_games: int
    efficiency_ratio: float
    best_species: Optional[str]  # Espèce avec le meilleur ratio
    worst_species: Optional[str]  # Espèce avec le pire ratio


class StatsResponse(BaseModel):
    """Statistiques générales"""
    total_hunters: int
    total_games: int
    total_cartridges_used: int
    total_cartridges_purchased: int
    total_spent: float
    average_efficiency: float
    top_hunters: List[HunterStatsResponse]
    species_distribution: List[SpeciesStatsResponse]
    last_5_seasons: List[SeasonStatsResponse]
