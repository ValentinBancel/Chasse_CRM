from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from ..core.database import get_db
from ..core.security import get_current_user, get_current_admin_user
from ..models.user import User
from ..schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/hunters", tags=["hunters"])


@router.get("", response_model=List[UserResponse])
def list_hunters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lister tous les chasseurs"""
    hunters = db.query(User).order_by(User.nom, User.prenom).all()
    return [UserResponse.model_validate(h) for h in hunters]


@router.get("/{hunter_id}", response_model=UserResponse)
def get_hunter(
    hunter_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir un chasseur par ID"""
    hunter = db.query(User).filter(User.id == hunter_id).first()
    if not hunter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chasseur introuvable"
        )
    return UserResponse.model_validate(hunter)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_hunter(
    hunter_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Créer un nouveau chasseur (admin uniquement)"""

    # Vérifier si l'email existe déjà
    existing = db.query(User).filter(User.email == hunter_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un chasseur avec cet email existe déjà"
        )

    # Créer le chasseur
    new_hunter = User(
        nom=hunter_data.nom,
        prenom=hunter_data.prenom,
        email=hunter_data.email,
        hashed_password=hunter_data.password,
        role=hunter_data.role or "chasseur"
    )
    db.add(new_hunter)
    db.commit()
    db.refresh(new_hunter)

    return UserResponse.model_validate(new_hunter)


@router.put("/{hunter_id}", response_model=UserResponse)
def update_hunter(
    hunter_id: UUID,
    hunter_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Modifier un chasseur (admin uniquement)"""

    hunter = db.query(User).filter(User.id == hunter_id).first()
    if not hunter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chasseur introuvable"
        )

    # Mettre à jour les champs
    update_data = hunter_data.model_dump(exclude_unset=True)

    if "password" in update_data:
        update_data["hashed_password"] = update_data.pop("password")

    if "email" in update_data and update_data["email"] != hunter.email:
        # Vérifier si le nouvel email existe déjà
        existing = db.query(User).filter(User.email == update_data["email"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un chasseur avec cet email existe déjà"
            )

    for field, value in update_data.items():
        setattr(hunter, field, value)

    db.commit()
    db.refresh(hunter)

    return UserResponse.model_validate(hunter)


@router.delete("/{hunter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hunter(
    hunter_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Supprimer un chasseur (admin uniquement)"""

    hunter = db.query(User).filter(User.id == hunter_id).first()
    if not hunter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chasseur introuvable"
        )

    # Ne pas permettre la suppression de soi-même
    if hunter.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas supprimer votre propre compte"
        )

    db.delete(hunter)
    db.commit()

    return None
