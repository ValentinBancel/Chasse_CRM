# Structure du Projet Chasse App

## Architecture Globale

```
chasse_app/
├── backend/              # API FastAPI (Python)
├── frontend/             # Application Next.js (TypeScript)
├── docker-compose.yml    # Orchestration des services
└── README.md            # Documentation principale
```

## Backend (FastAPI)

### Structure des fichiers

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py         # Configuration (settings, env vars)
│   │   ├── database.py       # Configuration SQLAlchemy
│   │   └── security.py       # JWT, hachage de mots de passe
│   │
│   ├── models/
│   │   ├── user.py           # Modèle User (chasseurs)
│   │   ├── cartridge.py      # Modèles CartridgeType, Purchase, Usage
│   │   ├── game.py           # Modèles Game, GameSpecies, GameCartridge
│   │   └── season.py         # Modèle Season (saisons cynégétiques)
│   │
│   ├── schemas/
│   │   ├── user.py           # Schémas Pydantic pour utilisateurs
│   │   ├── cartridge.py      # Schémas pour cartouches
│   │   ├── game.py           # Schémas pour gibiers
│   │   ├── season.py         # Schémas pour saisons
│   │   └── stats.py          # Schémas pour statistiques
│   │
│   ├── routes/
│   │   ├── auth.py           # Routes d'authentification
│   │   ├── cartridges.py     # Routes de gestion des cartouches
│   │   ├── game.py           # Routes de gestion des gibiers
│   │   ├── stats.py          # Routes de statistiques
│   │   └── hunters.py        # Routes de gestion des chasseurs
│   │
│   └── main.py              # Point d'entrée de l'application
│
├── alembic/                 # Migrations de base de données
│   ├── versions/            # Fichiers de migration
│   ├── env.py              # Configuration Alembic
│   └── script.py.mako      # Template de migration
│
├── requirements.txt         # Dépendances Python
├── seed_data.py            # Script de peuplement de la BD
├── alembic.ini             # Configuration Alembic
├── Dockerfile              # Image Docker
└── .env.example            # Exemple de variables d'environnement
```

### Modèles de Données

#### User (Utilisateur/Chasseur)
- id, nom, prenom, email, password (hashé)
- role (admin ou chasseur)
- Relations : purchases, usages, games

#### CartridgeType (Type de Cartouche)
- charge_type (Normal, Super, Magnum)
- pellet_size (2, 3, 4, 5, 6, 6.5, 7, 7.5, 8)
- brand (marque)
- Contrainte d'unicité sur (charge + pellet + brand)

#### CartridgePurchase (Achat)
- hunter_id, cartridge_type_id
- quantity, unit_price, purchase_date
- Calcul automatique : total_price

#### CartridgeUsage (Utilisation)
- hunter_id, cartridge_type_id
- quantity, usage_date
- game_id (nullable pour tirs ratés)

#### GameSpecies (Espèce de Gibier)
- name (Sanglier, Chevreuil, etc.)

#### Game (Gibier)
- hunter_id, species_id, kill_date
- weight, sex, location (optionnels)
- Relations : game_cartridges

#### GameCartridge (Cartouches utilisées)
- game_id, cartridge_type_id, quantity
- Table de liaison many-to-many

#### Season (Saison Cynégétique)
- year_start, start_date, end_date
- Septembre à Février

### Endpoints API

#### Authentication (`/auth`)
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Rafraîchir le token
- `GET /auth/me` - Profil utilisateur

#### Cartridges (`/cartridges`)
- `GET /cartridges/types` - Liste des types
- `POST /cartridges/types` - Créer un type
- `GET /cartridges/stock` - Stock actuel (avec filtres)
- `POST /cartridges/purchase` - Enregistrer un achat
- `POST /cartridges/use` - Enregistrer une utilisation
- `GET /cartridges/history` - Historique des mouvements

#### Game (`/game`)
- `GET /game/species` - Liste des espèces
- `POST /game/species` - Créer une espèce
- `GET /game` - Liste des gibiers (avec filtres)
- `GET /game/{id}` - Détails d'un gibier
- `POST /game` - Enregistrer un gibier
- `PUT /game/{id}` - Modifier un gibier
- `DELETE /game/{id}` - Supprimer un gibier

#### Stats (`/stats`)
- `GET /stats/summary` - Statistiques générales
- `GET /stats/by-hunter` - Par chasseur (avec saison)
- `GET /stats/by-species` - Par espèce (avec filtres)
- `GET /stats/by-season/{year}` - Par saison
- `GET /stats/efficiency` - Ratio cartouches/gibier

#### Hunters (`/hunters`)
- `GET /hunters` - Liste des chasseurs
- `GET /hunters/{id}` - Détails d'un chasseur
- `POST /hunters` - Créer un chasseur (admin)
- `PUT /hunters/{id}` - Modifier un chasseur (admin)
- `DELETE /hunters/{id}` - Supprimer un chasseur (admin)

## Frontend (Next.js)

### Structure des fichiers

```
frontend/
├── src/
│   ├── app/
│   │   ├── login/          # Page de connexion
│   │   ├── register/       # Page d'inscription
│   │   ├── dashboard/      # Tableau de bord
│   │   ├── cartridges/     # Gestion des cartouches
│   │   ├── game/           # Gestion des gibiers
│   │   ├── stats/          # Page de statistiques
│   │   ├── hunters/        # Gestion des chasseurs (admin)
│   │   ├── layout.tsx      # Layout racine
│   │   ├── page.tsx        # Page d'accueil (redirection)
│   │   └── globals.css     # Styles globaux
│   │
│   ├── components/
│   │   └── Layout.tsx      # Layout avec navigation
│   │
│   ├── lib/
│   │   └── api.ts          # Client API Axios
│   │
│   ├── store/
│   │   └── authStore.ts    # Store Zustand pour l'auth
│   │
│   └── types/
│       └── index.ts        # Types TypeScript
│
├── package.json            # Dépendances Node.js
├── tsconfig.json           # Configuration TypeScript
├── tailwind.config.js      # Configuration Tailwind
├── next.config.js          # Configuration Next.js
├── Dockerfile              # Image Docker
└── .env.local              # Variables d'environnement
```

### Pages Principales

#### `/login` - Connexion
- Formulaire email/password
- Redirection vers dashboard après connexion
- Lien vers inscription

#### `/register` - Inscription
- Formulaire complet (nom, prénom, email, password)
- Création automatique de compte
- Connexion automatique après inscription

#### `/dashboard` - Tableau de bord
- Statistiques générales
- Alertes de stock faible
- Top 3 chasseurs
- Distribution par espèce
- Accès rapides aux fonctionnalités

#### `/cartridges` - Gestion des Cartouches
- Vue du stock actuel
- Filtres par chasseur, type, plomb
- Tableau avec alertes de stock faible
- Formulaire d'achat (à compléter)
- Historique des mouvements

#### `/game` - Gestion des Gibiers
- Liste de tous les gibiers
- Filtres par chasseur, espèce, date
- Affichage détaillé (date, espèce, poids, sexe, lieu, cartouches)
- Actions : modifier, supprimer
- Bouton pour enregistrer un nouveau gibier

#### `/stats` - Statistiques
- Vue d'ensemble globale
- Classement des chasseurs
- Distribution par espèce avec graphiques en barres
- Évolution sur les 5 dernières saisons
- Ratios d'efficacité

#### `/hunters` - Gestion des Chasseurs (Admin)
- Liste de tous les chasseurs
- Création, modification, suppression
- Réservé aux administrateurs

### State Management

#### AuthStore (Zustand)
- user, accessToken, refreshToken
- isAuthenticated, isLoading, error
- Actions : login(), register(), logout()
- Persistance dans localStorage

### Types TypeScript

Types complets pour :
- User, UserCreate, LoginCredentials, AuthResponse
- CartridgeType, CartridgePurchase, CartridgeUsage, CartridgeStock
- GameSpecies, Game, GameCreate, GameCartridge
- Stats, HunterStats, SpeciesStats, SeasonStats, EfficiencyStats

### Styling

#### Tailwind CSS
- Palette personnalisée :
  - `forest` : Vert forêt pour la navigation
  - `earth` : Marron terre pour les accents
- Classes utilitaires personnalisées :
  - `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`
  - `.input`, `.card`, `.table`

## Docker

### Services

1. **db** (PostgreSQL 16)
   - Port : 5432
   - Healthcheck pour attendre le démarrage

2. **backend** (FastAPI)
   - Port : 8000
   - Dépend de db
   - Exécute les migrations au démarrage
   - Hot reload activé

3. **frontend** (Next.js)
   - Port : 3000
   - Dépend de backend
   - Hot reload activé

### Volumes
- `postgres_data` : Persistance des données PostgreSQL

## Données de Test

Le script `seed_data.py` crée :
- 4 utilisateurs (1 admin + 3 chasseurs)
- 5 types de cartouches
- Plusieurs achats de cartouches
- 12 espèces de gibier
- 7 gibiers avec cartouches associées
- Quelques tirs ratés

## Sécurité

- Mots de passe hashés avec bcrypt
- JWT tokens avec expiration (30 min pour access, 7 jours pour refresh)
- Validation des inputs avec Pydantic
- CORS configuré pour le frontend
- Protection des routes avec dépendances FastAPI
- Rôles admin/chasseur pour les permissions

## Performance

### Backend
- Pool de connexions PostgreSQL (10 connexions + 20 overflow)
- Index sur les colonnes fréquemment recherchées (email, dates)
- Requêtes optimisées avec jointures

### Frontend
- Next.js App Router avec Server Components
- Code splitting automatique
- Images optimisées (si utilisées)
- CSS optimisé avec Tailwind

## Points d'Extension

### Fonctionnalités à Ajouter
1. Upload de photos pour les gibiers
2. Export PDF/Excel des statistiques
3. Graphiques interactifs avec Recharts
4. Notifications en temps réel
5. Gestion des territoires de chasse
6. Application mobile
7. Mode hors ligne
8. Partage social

### Améliorations Techniques
1. Tests unitaires (pytest pour backend, jest pour frontend)
2. Tests d'intégration
3. CI/CD avec GitHub Actions
4. Monitoring avec Sentry
5. Logs centralisés
6. Cache Redis pour les stats
7. WebSockets pour les mises à jour temps réel
8. Rate limiting avancé

## Maintenance

### Migrations de Base de Données
```bash
# Créer une migration
alembic revision --autogenerate -m "Description"

# Appliquer les migrations
alembic upgrade head

# Revenir en arrière
alembic downgrade -1
```

### Mise à Jour des Dépendances
```bash
# Backend
pip install --upgrade -r requirements.txt

# Frontend
npm update
```

### Backup de la Base de Données
```bash
docker-compose exec db pg_dump -U chasse_user chasse_db > backup.sql
```

### Restauration
```bash
docker-compose exec -T db psql -U chasse_user chasse_db < backup.sql
```

## Support

Pour toute question ou problème, consultez :
1. Le README.md principal
2. La documentation API : http://localhost:8000/docs
3. Les logs : `docker-compose logs -f`
