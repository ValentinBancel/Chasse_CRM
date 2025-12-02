from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.game import GameSpecies, Game, GameCartridge
from ..models.cartridge import CartridgeType, CartridgeUsage
from ..schemas.game import (
    GameSpeciesCreate, GameSpeciesResponse,
    GameCreate, GameUpdate, GameResponse
)
from ..routes.cartridges import get_stock_for_type

router = APIRouter(prefix="/game", tags=["game"])


@router.post("/species", response_model=GameSpeciesResponse, status_code=status.HTTP_201_CREATED)
def create_species(
    species_data: GameSpeciesCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer une nouvelle espèce de gibier"""

    # Vérifier si l'espèce existe déjà
    existing = db.query(GameSpecies).filter(
        GameSpecies.name == species_data.name
    ).first()

    if existing:
        return GameSpeciesResponse.model_validate(existing)

    # Créer la nouvelle espèce
    new_species = GameSpecies(**species_data.model_dump())
    db.add(new_species)
    db.commit()
    db.refresh(new_species)

    return GameSpeciesResponse.model_validate(new_species)


@router.get("/species", response_model=List[GameSpeciesResponse])
def list_species(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lister toutes les espèces de gibier"""
    species = db.query(GameSpecies).order_by(GameSpecies.name).all()
    return [GameSpeciesResponse.model_validate(s) for s in species]


@router.post("", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
def create_game(
    game_data: GameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enregistrer un gibier"""

    # Vérifier que l'espèce existe
    species = db.query(GameSpecies).filter(
        GameSpecies.id == game_data.species_id
    ).first()
    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espèce introuvable"
        )

    # Vérifier le stock de cartouches pour chaque type
    for cartridge in game_data.cartridges:
        stock = get_stock_for_type(db, game_data.hunter_id, cartridge.cartridge_type_id)
        if stock < cartridge.quantity:
            cartridge_type = db.query(CartridgeType).filter(
                CartridgeType.id == cartridge.cartridge_type_id
            ).first()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuffisant pour {cartridge_type.brand}. Disponible: {stock}"
            )

    # Créer le gibier
    new_game = Game(
        hunter_id=game_data.hunter_id,
        species_id=game_data.species_id,
        kill_date=game_data.kill_date,
        weight=game_data.weight,
        sex=game_data.sex,
        location=game_data.location
    )
    db.add(new_game)
    db.flush()  # Pour obtenir l'ID du gibier

    # Ajouter les cartouches utilisées
    for cartridge in game_data.cartridges:
        # Créer la relation game_cartridge
        game_cartridge = GameCartridge(
            game_id=new_game.id,
            cartridge_type_id=cartridge.cartridge_type_id,
            quantity=cartridge.quantity
        )
        db.add(game_cartridge)

        # Créer l'utilisation de cartouche
        usage = CartridgeUsage(
            hunter_id=game_data.hunter_id,
            cartridge_type_id=cartridge.cartridge_type_id,
            quantity=cartridge.quantity,
            usage_date=game_data.kill_date,
            game_id=new_game.id
        )
        db.add(usage)

    db.commit()
    db.refresh(new_game)

    return GameResponse.model_validate(new_game)


@router.get("", response_model=List[GameResponse])
def list_games(
    hunter_id: Optional[UUID] = Query(None),
    species_id: Optional[UUID] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    season_year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lister les gibiers avec filtres"""

    query = db.query(Game)

    if hunter_id:
        query = query.filter(Game.hunter_id == hunter_id)
    if species_id:
        query = query.filter(Game.species_id == species_id)
    if start_date:
        query = query.filter(Game.kill_date >= start_date)
    if end_date:
        query = query.filter(Game.kill_date <= end_date)
    if season_year:
        # Saison de septembre N à février N+1
        season_start = datetime(season_year, 9, 1)
        season_end = datetime(season_year + 1, 3, 1)  # Fin février = début mars
        query = query.filter(
            Game.kill_date >= season_start,
            Game.kill_date < season_end
        )

    games = query.order_by(Game.kill_date.desc()).all()
    return [GameResponse.model_validate(g) for g in games]


@router.get("/{game_id}", response_model=GameResponse)
def get_game(
    game_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir un gibier par ID"""

    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gibier introuvable"
        )

    return GameResponse.model_validate(game)


@router.put("/{game_id}", response_model=GameResponse)
def update_game(
    game_id: UUID,
    game_data: GameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Modifier un gibier"""

    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gibier introuvable"
        )

    # Mettre à jour les champs
    update_data = game_data.model_dump(exclude_unset=True)

    # Gérer les cartouches séparément
    if "cartridges" in update_data:
        cartridges = update_data.pop("cartridges")

        # Supprimer les anciennes cartouches
        db.query(GameCartridge).filter(GameCartridge.game_id == game_id).delete()
        db.query(CartridgeUsage).filter(CartridgeUsage.game_id == game_id).delete()

        # Ajouter les nouvelles cartouches
        for cartridge in cartridges:
            game_cartridge = GameCartridge(
                game_id=game_id,
                cartridge_type_id=cartridge.cartridge_type_id,
                quantity=cartridge.quantity
            )
            db.add(game_cartridge)

            usage = CartridgeUsage(
                hunter_id=game.hunter_id,
                cartridge_type_id=cartridge.cartridge_type_id,
                quantity=cartridge.quantity,
                usage_date=game.kill_date,
                game_id=game_id
            )
            db.add(usage)

    # Mettre à jour les autres champs
    for field, value in update_data.items():
        setattr(game, field, value)

    db.commit()
    db.refresh(game)

    return GameResponse.model_validate(game)


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_game(
    game_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer un gibier"""

    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gibier introuvable"
        )

    # Les cartouches et utilisations seront supprimées en cascade
    db.delete(game)
    db.commit()

    return None
