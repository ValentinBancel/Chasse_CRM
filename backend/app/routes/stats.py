from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import List, Optional, Dict
from datetime import datetime
from uuid import UUID
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.game import Game, GameSpecies, GameCartridge
from ..models.cartridge import CartridgePurchase, CartridgeUsage
from ..schemas.stats import (
    StatsResponse, HunterStatsResponse, SpeciesStatsResponse,
    SeasonStatsResponse, EfficiencyStatsResponse
)

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary", response_model=StatsResponse)
def get_summary_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir les statistiques générales"""

    # Total chasseurs
    total_hunters = db.query(func.count(distinct(User.id))).scalar()

    # Total gibiers
    total_games = db.query(func.count(Game.id)).scalar()

    # Total cartouches utilisées
    total_cartridges_used = db.query(func.sum(CartridgeUsage.quantity)).scalar() or 0

    # Total cartouches achetées
    total_cartridges_purchased = db.query(func.sum(CartridgePurchase.quantity)).scalar() or 0

    # Total dépensé
    total_spent = db.query(
        func.sum(CartridgePurchase.quantity * CartridgePurchase.unit_price)
    ).scalar() or 0.0

    # Efficacité moyenne
    average_efficiency = total_cartridges_used / total_games if total_games > 0 else 0

    # Top 3 chasseurs
    top_hunters = get_hunters_stats(db, limit=3)

    # Distribution par espèce
    species_distribution = get_species_stats(db)

    # Dernières 5 saisons
    current_year = datetime.now().year
    last_5_seasons = []
    for year in range(current_year - 4, current_year + 1):
        season_stats = get_season_stats(db, year)
        if season_stats:
            last_5_seasons.append(season_stats)

    return StatsResponse(
        total_hunters=total_hunters,
        total_games=total_games,
        total_cartridges_used=total_cartridges_used,
        total_cartridges_purchased=total_cartridges_purchased,
        total_spent=total_spent,
        average_efficiency=average_efficiency,
        top_hunters=top_hunters,
        species_distribution=species_distribution,
        last_5_seasons=last_5_seasons
    )


@router.get("/by-hunter", response_model=List[HunterStatsResponse])
def get_by_hunter(
    season_year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir les statistiques par chasseur"""
    return get_hunters_stats(db, season_year=season_year)


@router.get("/by-species", response_model=List[SpeciesStatsResponse])
def get_by_species(
    season_year: Optional[int] = Query(None),
    hunter_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir les statistiques par espèce"""
    return get_species_stats(db, season_year=season_year, hunter_id=hunter_id)


@router.get("/by-season/{year}", response_model=SeasonStatsResponse)
def get_by_season(
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir les statistiques d'une saison"""
    stats = get_season_stats(db, year)
    if not stats:
        return SeasonStatsResponse(
            season_name=f"{year}-{year+1}",
            year_start=year,
            total_games=0,
            total_cartridges_used=0,
            hunters_stats=[],
            species_stats=[]
        )
    return stats


@router.get("/efficiency", response_model=List[EfficiencyStatsResponse])
def get_efficiency(
    season_year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir les statistiques d'efficacité"""

    # Construire la requête de base
    query = db.query(User)

    # Filtrer par saison si spécifié
    if season_year:
        season_start = datetime(season_year, 9, 1)
        season_end = datetime(season_year + 1, 3, 1)

    efficiency_stats = []

    for hunter in query.all():
        # Requête des gibiers
        games_query = db.query(Game).filter(Game.hunter_id == hunter.id)
        if season_year:
            games_query = games_query.filter(
                Game.kill_date >= season_start,
                Game.kill_date < season_end
            )

        total_games = games_query.count()

        # Requête des cartouches utilisées
        usages_query = db.query(func.sum(CartridgeUsage.quantity)).filter(
            CartridgeUsage.hunter_id == hunter.id
        )
        if season_year:
            usages_query = usages_query.filter(
                CartridgeUsage.usage_date >= season_start,
                CartridgeUsage.usage_date < season_end
            )

        total_cartridges = usages_query.scalar() or 0

        # Calculer l'efficacité
        efficiency_ratio = total_cartridges / total_games if total_games > 0 else 0

        # Trouver la meilleure et pire espèce
        species_efficiency = {}
        for game in games_query.all():
            species_name = game.species.name
            cartridges_used = sum(gc.quantity for gc in game.game_cartridges)

            if species_name not in species_efficiency:
                species_efficiency[species_name] = {"cartridges": 0, "games": 0}

            species_efficiency[species_name]["cartridges"] += cartridges_used
            species_efficiency[species_name]["games"] += 1

        best_species = None
        worst_species = None
        best_ratio = float('inf')
        worst_ratio = 0

        for species, data in species_efficiency.items():
            ratio = data["cartridges"] / data["games"] if data["games"] > 0 else 0
            if ratio < best_ratio and ratio > 0:
                best_ratio = ratio
                best_species = species
            if ratio > worst_ratio:
                worst_ratio = ratio
                worst_species = species

        efficiency_stats.append(EfficiencyStatsResponse(
            hunter_id=hunter.id,
            hunter_name=f"{hunter.prenom} {hunter.nom}",
            total_cartridges=total_cartridges,
            total_games=total_games,
            efficiency_ratio=efficiency_ratio,
            best_species=best_species,
            worst_species=worst_species
        ))

    # Trier par efficacité (moins de cartouches = meilleur)
    efficiency_stats.sort(key=lambda x: x.efficiency_ratio if x.efficiency_ratio > 0 else float('inf'))

    return efficiency_stats


# Fonctions utilitaires

def get_hunters_stats(
    db: Session,
    season_year: Optional[int] = None,
    limit: Optional[int] = None
) -> List[HunterStatsResponse]:
    """Obtenir les stats des chasseurs"""

    hunters = db.query(User).all()
    stats = []

    for hunter in hunters:
        # Filtrer par saison si spécifié
        games_query = db.query(Game).filter(Game.hunter_id == hunter.id)
        usages_query = db.query(CartridgeUsage).filter(CartridgeUsage.hunter_id == hunter.id)
        purchases_query = db.query(CartridgePurchase).filter(CartridgePurchase.hunter_id == hunter.id)

        if season_year:
            season_start = datetime(season_year, 9, 1)
            season_end = datetime(season_year + 1, 3, 1)
            games_query = games_query.filter(
                Game.kill_date >= season_start,
                Game.kill_date < season_end
            )
            usages_query = usages_query.filter(
                CartridgeUsage.usage_date >= season_start,
                CartridgeUsage.usage_date < season_end
            )
            purchases_query = purchases_query.filter(
                CartridgePurchase.purchase_date >= season_start,
                CartridgePurchase.purchase_date < season_end
            )

        total_games = games_query.count()
        total_cartridges_used = db.query(func.sum(CartridgeUsage.quantity)).filter(
            CartridgeUsage.id.in_([u.id for u in usages_query.all()])
        ).scalar() or 0

        total_cartridges_purchased = db.query(func.sum(CartridgePurchase.quantity)).filter(
            CartridgePurchase.id.in_([p.id for p in purchases_query.all()])
        ).scalar() or 0

        total_spent = db.query(
            func.sum(CartridgePurchase.quantity * CartridgePurchase.unit_price)
        ).filter(
            CartridgePurchase.id.in_([p.id for p in purchases_query.all()])
        ).scalar() or 0.0

        efficiency_ratio = total_cartridges_used / total_games if total_games > 0 else 0

        # Gibiers par espèce
        games_by_species: Dict[str, int] = {}
        for game in games_query.all():
            species_name = game.species.name
            games_by_species[species_name] = games_by_species.get(species_name, 0) + 1

        stats.append(HunterStatsResponse(
            hunter_id=hunter.id,
            hunter_name=f"{hunter.prenom} {hunter.nom}",
            total_games=total_games,
            total_cartridges_used=total_cartridges_used,
            total_cartridges_purchased=total_cartridges_purchased,
            total_spent=total_spent,
            efficiency_ratio=efficiency_ratio,
            games_by_species=games_by_species
        ))

    # Trier par nombre de gibiers
    stats.sort(key=lambda x: x.total_games, reverse=True)

    if limit:
        stats = stats[:limit]

    return stats


def get_species_stats(
    db: Session,
    season_year: Optional[int] = None,
    hunter_id: Optional[UUID] = None
) -> List[SpeciesStatsResponse]:
    """Obtenir les stats par espèce"""

    species_list = db.query(GameSpecies).all()
    stats = []

    for species in species_list:
        query = db.query(Game).filter(Game.species_id == species.id)

        if season_year:
            season_start = datetime(season_year, 9, 1)
            season_end = datetime(season_year + 1, 3, 1)
            query = query.filter(
                Game.kill_date >= season_start,
                Game.kill_date < season_end
            )

        if hunter_id:
            query = query.filter(Game.hunter_id == hunter_id)

        total_killed = query.count()

        if total_killed == 0:
            continue

        # Calculer la moyenne de cartouches par gibier
        total_cartridges = 0
        for game in query.all():
            total_cartridges += sum(gc.quantity for gc in game.game_cartridges)

        average_cartridges = total_cartridges / total_killed if total_killed > 0 else 0

        # Nombre de chasseurs différents
        hunters_count = db.query(func.count(distinct(Game.hunter_id))).filter(
            Game.id.in_([g.id for g in query.all()])
        ).scalar()

        stats.append(SpeciesStatsResponse(
            species_name=species.name,
            total_killed=total_killed,
            average_cartridges_per_kill=average_cartridges,
            hunters_count=hunters_count
        ))

    # Trier par nombre total
    stats.sort(key=lambda x: x.total_killed, reverse=True)

    return stats


def get_season_stats(db: Session, year: int) -> Optional[SeasonStatsResponse]:
    """Obtenir les stats d'une saison"""

    season_start = datetime(year, 9, 1)
    season_end = datetime(year + 1, 3, 1)

    # Total gibiers
    total_games = db.query(func.count(Game.id)).filter(
        Game.kill_date >= season_start,
        Game.kill_date < season_end
    ).scalar()

    if total_games == 0:
        return None

    # Total cartouches utilisées
    total_cartridges_used = db.query(func.sum(CartridgeUsage.quantity)).filter(
        CartridgeUsage.usage_date >= season_start,
        CartridgeUsage.usage_date < season_end
    ).scalar() or 0

    # Stats par chasseur
    hunters_stats = get_hunters_stats(db, season_year=year)

    # Stats par espèce
    species_stats = get_species_stats(db, season_year=year)

    return SeasonStatsResponse(
        season_name=f"{year}-{year+1}",
        year_start=year,
        total_games=total_games,
        total_cartridges_used=total_cartridges_used,
        hunters_stats=hunters_stats,
        species_stats=species_stats
    )
