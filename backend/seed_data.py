"""Script pour peupler la base de données avec des données de test"""
from datetime import datetime, timedelta
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import (
    User, CartridgeType, CartridgePurchase, CartridgeUsage,
    GameSpecies, Game, GameCartridge
)
from app.models.user import UserRole
from app.models.cartridge import ChargeType, PelletSize
from app.models.game import GameSex


def seed_database():
    db = SessionLocal()

    try:
        print("Création des utilisateurs...")
        # Créer des utilisateurs
        admin = User(
            nom="Admin",
            prenom="Super",
            email="admin@chasse.fr",
            hashed_password=hash_password("admin123"),
            role=UserRole.ADMIN
        )
        db.add(admin)

        chasseur1 = User(
            nom="Dupont",
            prenom="Jean",
            email="jean.dupont@chasse.fr",
            hashed_password=hash_password("password123"),
            role=UserRole.CHASSEUR
        )
        db.add(chasseur1)

        chasseur2 = User(
            nom="Martin",
            prenom="Pierre",
            email="pierre.martin@chasse.fr",
            hashed_password=hash_password("password123"),
            role=UserRole.CHASSEUR
        )
        db.add(chasseur2)

        chasseur3 = User(
            nom="Durand",
            prenom="Paul",
            email="paul.durand@chasse.fr",
            hashed_password=hash_password("password123"),
            role=UserRole.CHASSEUR
        )
        db.add(chasseur3)

        db.flush()

        print("Création des types de cartouches...")
        # Créer des types de cartouches
        cartridge_types = [
            CartridgeType(charge_type=ChargeType.NORMAL, pellet_size=PelletSize.SIZE_7, brand="Winchester"),
            CartridgeType(charge_type=ChargeType.SUPER, pellet_size=PelletSize.SIZE_6, brand="Remington"),
            CartridgeType(charge_type=ChargeType.MAGNUM, pellet_size=PelletSize.SIZE_4, brand="Federal"),
            CartridgeType(charge_type=ChargeType.NORMAL, pellet_size=PelletSize.SIZE_7_5, brand="Fiocchi"),
            CartridgeType(charge_type=ChargeType.SUPER, pellet_size=PelletSize.SIZE_5, brand="Winchester"),
        ]
        for ct in cartridge_types:
            db.add(ct)
        db.flush()

        print("Création des achats de cartouches...")
        # Créer des achats de cartouches
        purchases = [
            CartridgePurchase(
                hunter_id=chasseur1.id,
                cartridge_type_id=cartridge_types[0].id,
                quantity=100,
                unit_price=0.45,
                purchase_date=datetime.now() - timedelta(days=30)
            ),
            CartridgePurchase(
                hunter_id=chasseur1.id,
                cartridge_type_id=cartridge_types[1].id,
                quantity=50,
                unit_price=0.55,
                purchase_date=datetime.now() - timedelta(days=25)
            ),
            CartridgePurchase(
                hunter_id=chasseur2.id,
                cartridge_type_id=cartridge_types[0].id,
                quantity=150,
                unit_price=0.42,
                purchase_date=datetime.now() - timedelta(days=28)
            ),
            CartridgePurchase(
                hunter_id=chasseur2.id,
                cartridge_type_id=cartridge_types[2].id,
                quantity=75,
                unit_price=0.65,
                purchase_date=datetime.now() - timedelta(days=20)
            ),
            CartridgePurchase(
                hunter_id=chasseur3.id,
                cartridge_type_id=cartridge_types[3].id,
                quantity=200,
                unit_price=0.40,
                purchase_date=datetime.now() - timedelta(days=35)
            ),
        ]
        for purchase in purchases:
            db.add(purchase)
        db.flush()

        print("Création des espèces de gibier...")
        # Créer des espèces de gibier
        species_names = [
            "Sanglier", "Chevreuil", "Cerf", "Biche", "Faisan",
            "Perdrix", "Lapin", "Lièvre", "Canard", "Pigeon",
            "Bécasse", "Renard"
        ]
        species = []
        for name in species_names:
            s = GameSpecies(name=name)
            db.add(s)
            species.append(s)
        db.flush()

        print("Création des gibiers...")
        # Créer des gibiers avec cartouches
        games_data = [
            {
                "hunter": chasseur1,
                "species": species[0],  # Sanglier
                "kill_date": datetime.now() - timedelta(days=15),
                "weight": 85.5,
                "sex": GameSex.MALE,
                "location": "Forêt de Rambouillet",
                "cartridges": [(cartridge_types[2], 3)]
            },
            {
                "hunter": chasseur1,
                "species": species[4],  # Faisan
                "kill_date": datetime.now() - timedelta(days=12),
                "weight": 1.2,
                "sex": GameSex.MALE,
                "location": "Plaine de Beauce",
                "cartridges": [(cartridge_types[0], 2)]
            },
            {
                "hunter": chasseur2,
                "species": species[1],  # Chevreuil
                "kill_date": datetime.now() - timedelta(days=18),
                "weight": 22.0,
                "sex": GameSex.FEMALE,
                "location": "Bois de Vincennes",
                "cartridges": [(cartridge_types[0], 2)]
            },
            {
                "hunter": chasseur2,
                "species": species[8],  # Canard
                "kill_date": datetime.now() - timedelta(days=10),
                "weight": 1.5,
                "sex": GameSex.MALE,
                "location": "Étang de la Dombes",
                "cartridges": [(cartridge_types[0], 1)]
            },
            {
                "hunter": chasseur2,
                "species": species[6],  # Lapin
                "kill_date": datetime.now() - timedelta(days=8),
                "weight": 2.3,
                "location": "Champs près de Chartres",
                "cartridges": [(cartridge_types[0], 1)]
            },
            {
                "hunter": chasseur3,
                "species": species[5],  # Perdrix
                "kill_date": datetime.now() - timedelta(days=20),
                "weight": 0.4,
                "location": "Champagne",
                "cartridges": [(cartridge_types[3], 3)]
            },
            {
                "hunter": chasseur3,
                "species": species[7],  # Lièvre
                "kill_date": datetime.now() - timedelta(days=14),
                "weight": 3.8,
                "sex": GameSex.MALE,
                "location": "Sologne",
                "cartridges": [(cartridge_types[3], 2)]
            },
        ]

        for game_data in games_data:
            game = Game(
                hunter_id=game_data["hunter"].id,
                species_id=game_data["species"].id,
                kill_date=game_data["kill_date"],
                weight=game_data.get("weight"),
                sex=game_data.get("sex"),
                location=game_data.get("location")
            )
            db.add(game)
            db.flush()

            for cartridge_type, quantity in game_data["cartridges"]:
                # Ajouter la relation game_cartridge
                game_cartridge = GameCartridge(
                    game_id=game.id,
                    cartridge_type_id=cartridge_type.id,
                    quantity=quantity
                )
                db.add(game_cartridge)

                # Ajouter l'utilisation de cartouche
                usage = CartridgeUsage(
                    hunter_id=game_data["hunter"].id,
                    cartridge_type_id=cartridge_type.id,
                    quantity=quantity,
                    usage_date=game_data["kill_date"],
                    game_id=game.id
                )
                db.add(usage)

        print("Création de tirs ratés...")
        # Ajouter quelques tirs ratés
        missed_shots = [
            CartridgeUsage(
                hunter_id=chasseur1.id,
                cartridge_type_id=cartridge_types[0].id,
                quantity=5,
                usage_date=datetime.now() - timedelta(days=7),
                game_id=None
            ),
            CartridgeUsage(
                hunter_id=chasseur2.id,
                cartridge_type_id=cartridge_types[0].id,
                quantity=3,
                usage_date=datetime.now() - timedelta(days=6),
                game_id=None
            ),
        ]
        for shot in missed_shots:
            db.add(shot)

        db.commit()
        print("Base de données peuplée avec succès!")

    except Exception as e:
        print(f"Erreur lors du peuplement de la base de données: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Démarrage du peuplement de la base de données...")
    seed_database()
