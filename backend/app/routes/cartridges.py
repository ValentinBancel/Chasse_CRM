from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.cartridge import CartridgeType, CartridgePurchase, CartridgeUsage
from ..schemas.cartridge import (
    CartridgeTypeCreate, CartridgeTypeResponse,
    CartridgePurchaseCreate, CartridgePurchaseResponse,
    CartridgeUsageCreate, CartridgeUsageResponse,
    CartridgeStockResponse,
    CartridgeTransferCreate
)

router = APIRouter(prefix="/cartridges", tags=["cartridges"])


@router.post("/types", response_model=CartridgeTypeResponse, status_code=status.HTTP_201_CREATED)
def create_cartridge_type(
    cartridge_data: CartridgeTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer un nouveau type de cartouche"""

    # Vérifier si le type existe déjà
    existing = db.query(CartridgeType).filter(
        CartridgeType.charge_type == cartridge_data.charge_type,
        CartridgeType.pellet_size == cartridge_data.pellet_size,
        CartridgeType.brand == cartridge_data.brand
    ).first()

    if existing:
        return CartridgeTypeResponse.model_validate(existing)

    # Créer le nouveau type
    new_type = CartridgeType(**cartridge_data.model_dump())
    db.add(new_type)
    db.commit()
    db.refresh(new_type)

    return CartridgeTypeResponse.model_validate(new_type)


@router.get("/types", response_model=List[CartridgeTypeResponse])
def list_cartridge_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lister tous les types de cartouches"""
    types = db.query(CartridgeType).all()
    return [CartridgeTypeResponse.model_validate(t) for t in types]


@router.post("/purchase", response_model=CartridgePurchaseResponse, status_code=status.HTTP_201_CREATED)
def create_purchase(
    purchase_data: CartridgePurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enregistrer un achat de cartouches"""

    # Vérifier que le type de cartouche existe
    cartridge_type = db.query(CartridgeType).filter(
        CartridgeType.id == purchase_data.cartridge_type_id
    ).first()
    if not cartridge_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Type de cartouche introuvable"
        )

    # Créer l'achat
    new_purchase = CartridgePurchase(**purchase_data.model_dump())
    db.add(new_purchase)
    db.commit()
    db.refresh(new_purchase)

    return CartridgePurchaseResponse.model_validate(new_purchase)


@router.post("/use", response_model=CartridgeUsageResponse, status_code=status.HTTP_201_CREATED)
def create_usage(
    usage_data: CartridgeUsageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enregistrer une utilisation de cartouches (tir raté)"""

    # Vérifier que le type de cartouche existe
    cartridge_type = db.query(CartridgeType).filter(
        CartridgeType.id == usage_data.cartridge_type_id
    ).first()
    if not cartridge_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Type de cartouche introuvable"
        )

    # Vérifier le stock disponible
    stock = get_stock_for_type(db, usage_data.hunter_id, usage_data.cartridge_type_id)
    if stock < usage_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuffisant. Disponible: {stock}, Demandé: {usage_data.quantity}"
        )

    # Créer l'utilisation
    new_usage = CartridgeUsage(**usage_data.model_dump())
    db.add(new_usage)
    db.commit()
    db.refresh(new_usage)

    return CartridgeUsageResponse.model_validate(new_usage)


@router.get("/stock", response_model=List[CartridgeStockResponse])
def get_stock(
    hunter_id: Optional[UUID] = Query(None),
    charge_type: Optional[str] = Query(None),
    pellet_size: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir le stock actuel de cartouches"""

    # Si pas de hunter_id spécifié, utiliser l'utilisateur connecté
    if not hunter_id:
        hunter_id = current_user.id

    # Requête pour obtenir tous les types de cartouches
    query = db.query(CartridgeType)
    if charge_type:
        query = query.filter(CartridgeType.charge_type == charge_type)
    if pellet_size:
        query = query.filter(CartridgeType.pellet_size == pellet_size)

    cartridge_types = query.all()

    # Calculer le stock pour chaque type
    stock_list = []
    for ct in cartridge_types:
        total_purchased = db.query(func.sum(CartridgePurchase.quantity)).filter(
            CartridgePurchase.hunter_id == hunter_id,
            CartridgePurchase.cartridge_type_id == ct.id
        ).scalar() or 0

        total_used = db.query(func.sum(CartridgeUsage.quantity)).filter(
            CartridgeUsage.hunter_id == hunter_id,
            CartridgeUsage.cartridge_type_id == ct.id
        ).scalar() or 0

        current_stock = total_purchased - total_used

        # Ne retourner que les types avec un stock (acheté au moins une fois)
        if total_purchased > 0:
            stock_list.append(CartridgeStockResponse(
                cartridge_type=CartridgeTypeResponse.model_validate(ct),
                hunter_id=hunter_id,
                total_purchased=total_purchased,
                total_used=total_used,
                current_stock=current_stock,
                is_low_stock=current_stock < 20
            ))

    return stock_list


@router.get("/history", response_model=List)
def get_history(
    hunter_id: Optional[UUID] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir l'historique des mouvements de cartouches"""

    if not hunter_id:
        hunter_id = current_user.id

    # Récupérer les achats
    purchases_query = db.query(CartridgePurchase).filter(
        CartridgePurchase.hunter_id == hunter_id
    )
    if start_date:
        purchases_query = purchases_query.filter(CartridgePurchase.purchase_date >= start_date)
    if end_date:
        purchases_query = purchases_query.filter(CartridgePurchase.purchase_date <= end_date)

    purchases = purchases_query.order_by(CartridgePurchase.purchase_date.desc()).all()

    # Récupérer les utilisations
    usages_query = db.query(CartridgeUsage).filter(
        CartridgeUsage.hunter_id == hunter_id,
        CartridgeUsage.game_id.is_(None)  # Seulement les tirs ratés
    )
    if start_date:
        usages_query = usages_query.filter(CartridgeUsage.usage_date >= start_date)
    if end_date:
        usages_query = usages_query.filter(CartridgeUsage.usage_date <= end_date)

    usages = usages_query.order_by(CartridgeUsage.usage_date.desc()).all()

    # Combiner et formater
    history = []
    for p in purchases:
        history.append({
            "type": "purchase",
            "date": p.purchase_date,
            "cartridge_type": CartridgeTypeResponse.model_validate(p.cartridge_type),
            "quantity": p.quantity,
            "unit_price": p.unit_price,
            "total_price": p.total_price
        })

    for u in usages:
        history.append({
            "type": "usage",
            "date": u.usage_date,
            "cartridge_type": CartridgeTypeResponse.model_validate(u.cartridge_type),
            "quantity": u.quantity
        })

    # Trier par date décroissante
    history.sort(key=lambda x: x["date"], reverse=True)

    return history


@router.post("/transfer", status_code=status.HTTP_201_CREATED)
def transfer_cartridges(
    transfer_data: CartridgeTransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Transférer des cartouches d'un chasseur à un autre"""

    # Vérifier que les chasseurs sont différents
    if transfer_data.from_hunter_id == transfer_data.to_hunter_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de transférer des cartouches à soi-même"
        )

    # Vérifier que le type de cartouche existe
    cartridge_type = db.query(CartridgeType).filter(
        CartridgeType.id == transfer_data.cartridge_type_id
    ).first()
    if not cartridge_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Type de cartouche introuvable"
        )

    # Vérifier le stock du donneur
    stock = get_stock_for_type(db, transfer_data.from_hunter_id, transfer_data.cartridge_type_id)
    if stock < transfer_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuffisant. Disponible: {stock}, Demandé: {transfer_data.quantity}"
        )

    # Créer une utilisation pour le donneur (retrait du stock)
    usage = CartridgeUsage(
        hunter_id=transfer_data.from_hunter_id,
        cartridge_type_id=transfer_data.cartridge_type_id,
        quantity=transfer_data.quantity,
        usage_date=transfer_data.transfer_date,
        game_id=None
    )
    db.add(usage)

    # Créer un achat pour le receveur (ajout au stock)
    # Prix unitaire = 0 pour indiquer que c'est un don
    purchase = CartridgePurchase(
        hunter_id=transfer_data.to_hunter_id,
        cartridge_type_id=transfer_data.cartridge_type_id,
        quantity=transfer_data.quantity,
        unit_price=0.0,
        purchase_date=transfer_data.transfer_date
    )
    db.add(purchase)

    db.commit()

    return {
        "message": "Transfert effectué avec succès",
        "from_hunter_id": transfer_data.from_hunter_id,
        "to_hunter_id": transfer_data.to_hunter_id,
        "cartridge_type": CartridgeTypeResponse.model_validate(cartridge_type),
        "quantity": transfer_data.quantity,
        "note": transfer_data.note
    }


def get_stock_for_type(db: Session, hunter_id: UUID, cartridge_type_id: UUID) -> int:
    """Calculer le stock disponible pour un type de cartouche"""
    total_purchased = db.query(func.sum(CartridgePurchase.quantity)).filter(
        CartridgePurchase.hunter_id == hunter_id,
        CartridgePurchase.cartridge_type_id == cartridge_type_id
    ).scalar() or 0

    total_used = db.query(func.sum(CartridgeUsage.quantity)).filter(
        CartridgeUsage.hunter_id == hunter_id,
        CartridgeUsage.cartridge_type_id == cartridge_type_id
    ).scalar() or 0

    return total_purchased - total_used
