# Chasse App - Application de Gestion de Chasse

Application web complète pour la gestion de chasse permettant de suivre les cartouches, gibiers et statistiques pour plusieurs chasseurs.

## 🎯 Fonctionnalités

### Gestion des Cartouches
- Suivi du stock par type (calibre 12, charge, taille de plomb, marque)
- Enregistrement des achats avec prix
- Enregistrement des utilisations (tirs ratés)
- Alertes de stock faible (< 20 cartouches)
- Historique complet des mouvements

### Gestion des Gibiers
- Enregistrement des prises avec détails (espèce, date, poids, sexe, lieu)
- Association automatique des cartouches utilisées
- Mise à jour automatique du stock
- Filtres par chasseur, espèce, saison
- Modification et suppression des entrées

### Statistiques Complètes
- Vue d'ensemble générale (totaux, efficacité moyenne)
- Statistiques par chasseur (prises, cartouches, dépenses)
- Statistiques par espèce (nombre tué, cartouches moyennes)
- Statistiques par saison cynégétique (septembre à février)
- Classement par efficacité (ratio cartouches/gibier)
- Graphiques et visualisations

### Gestion des Chasseurs
- Système multi-utilisateurs avec authentification JWT
- Rôles (admin et chasseur)
- Chaque chasseur peut voir les données de tous
- Interface admin pour gérer les utilisateurs

## 🛠 Stack Technique

### Backend
- **Framework**: FastAPI (Python)
- **Base de données**: PostgreSQL
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentification**: JWT (python-jose)
- **Validation**: Pydantic

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Forms**: React Hook Form

### DevOps
- **Conteneurisation**: Docker + Docker Compose
- **Base de données**: PostgreSQL 16

## 📋 Prérequis

- Docker et Docker Compose
- Node.js 20+ (pour développement local sans Docker)
- Python 3.11+ (pour développement local sans Docker)

## 🚀 Installation et Démarrage

### Avec Docker (Recommandé)

1. **Cloner le repository**
   ```bash
   git clone <votre-repo>
   cd chasse_app
   ```

2. **Démarrer tous les services**
   ```bash
   docker-compose up -d
   ```

   Cela va :
   - Démarrer PostgreSQL sur le port 5432
   - Démarrer le backend FastAPI sur le port 8000
   - Démarrer le frontend Next.js sur le port 3000
   - Exécuter les migrations automatiquement

3. **Vérifier que tout fonctionne**
   - Frontend : http://localhost:3000
   - Backend API : http://localhost:8000
   - Documentation API : http://localhost:8000/docs

4. **Peupler la base de données avec des données de test**
   ```bash
   docker-compose exec backend python seed_data.py
   ```

### Sans Docker (Développement Local)

#### Backend

1. **Installer PostgreSQL**
   - Créer une base de données `chasse_db`
   - Créer un utilisateur `chasse_user` avec le mot de passe `chasse_password`

2. **Configurer l'environnement**
   ```bash
   cd backend
   cp .env.example .env
   # Modifier .env avec vos paramètres
   ```

3. **Installer les dépendances Python**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Sur Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Exécuter les migrations**
   ```bash
   alembic upgrade head
   ```

5. **Démarrer le serveur**
   ```bash
   uvicorn app.main:app --reload
   ```

6. **Peupler avec des données de test**
   ```bash
   python seed_data.py
   ```

#### Frontend

1. **Installer les dépendances**
   ```bash
   cd frontend
   npm install
   ```

2. **Configurer l'environnement**
   ```bash
   cp .env.local.example .env.local
   # L'URL du backend est déjà configurée pour localhost:8000
   ```

3. **Démarrer le serveur de développement**
   ```bash
   npm run dev
   ```

## 👥 Comptes de Test

Après avoir exécuté le script de seed, vous pouvez vous connecter avec :

- **Admin**
  - Email: `admin@chasse.fr`
  - Password: `admin123`

- **Chasseur 1**
  - Email: `jean.dupont@chasse.fr`
  - Password: `password123`

- **Chasseur 2**
  - Email: `pierre.martin@chasse.fr`
  - Password: `password123`

- **Chasseur 3**
  - Email: `paul.durand@chasse.fr`
  - Password: `password123`

## 📊 Structure du Projet

```
chasse_app/
├── backend/                 # Backend FastAPI
│   ├── app/
│   │   ├── core/           # Configuration et sécurité
│   │   ├── models/         # Modèles SQLAlchemy
│   │   ├── schemas/        # Schémas Pydantic
│   │   ├── routes/         # Endpoints API
│   │   └── main.py         # Application principale
│   ├── alembic/            # Migrations de base de données
│   ├── requirements.txt    # Dépendances Python
│   └── Dockerfile
│
├── frontend/               # Frontend Next.js
│   ├── src/
│   │   ├── app/           # Pages (App Router)
│   │   ├── components/    # Composants réutilisables
│   │   ├── lib/           # Utilitaires et API client
│   │   ├── store/         # State management (Zustand)
│   │   └── types/         # Types TypeScript
│   ├── package.json
│   └── Dockerfile
│
└── docker-compose.yml      # Orchestration des services
```

## 🔧 Commandes Utiles

### Docker

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter tous les services
docker-compose down

# Reconstruire les images
docker-compose build

# Exécuter une commande dans un conteneur
docker-compose exec backend python seed_data.py
docker-compose exec backend alembic revision --autogenerate -m "Description"
```

### Base de données

```bash
# Créer une nouvelle migration
alembic revision --autogenerate -m "Description du changement"

# Appliquer les migrations
alembic upgrade head

# Revenir en arrière d'une migration
alembic downgrade -1
```

### Frontend

```bash
# Démarrer en mode développement
npm run dev

# Build pour production
npm run build

# Démarrer en mode production
npm start
```

## 📚 Documentation API

Une fois le backend démarré, accédez à :

- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

## 🔐 Sécurité

- Les mots de passe sont hashés avec bcrypt
- Authentification par JWT tokens
- Tokens d'accès valides 30 minutes
- Tokens de rafraîchissement valides 7 jours
- Validation des inputs avec Pydantic
- CORS configuré

## 🎨 Personnalisation

### Couleurs

Le thème utilise des couleurs nature :
- **Vert forêt** : Navigation et éléments principaux
- **Marron terre** : Accents et boutons secondaires

Les couleurs sont définies dans `frontend/tailwind.config.js` et peuvent être modifiées.

### Espèces de Gibier

Les espèces par défaut sont :
- Sanglier, Chevreuil, Cerf, Biche
- Faisan, Perdrix, Lapin, Lièvre
- Canard, Pigeon, Bécasse, Renard

Vous pouvez ajouter d'autres espèces via l'interface ou directement en base.

### Types de Cartouches

- **Calibre** : 12 (fixe)
- **Charge** : Normal, Super, Magnum
- **Taille de plomb** : 2, 3, 4, 5, 6, 6.5, 7, 7.5, 8
- **Marque** : Texte libre

## 🐛 Dépannage

### Le backend ne démarre pas
- Vérifiez que PostgreSQL est démarré
- Vérifiez les logs : `docker-compose logs backend`
- Vérifiez les variables d'environnement dans `.env`

### Le frontend ne se connecte pas au backend
- Vérifiez que `NEXT_PUBLIC_API_URL` pointe vers `http://localhost:8000`
- Vérifiez que le backend est accessible
- Regardez la console du navigateur pour les erreurs CORS

### Problèmes de migrations
```bash
# Réinitialiser complètement la base
docker-compose down -v
docker-compose up -d
docker-compose exec backend alembic upgrade head
docker-compose exec backend python seed_data.py
```

## 📝 TODO / Améliorations Futures

- [ ] Ajout de photos pour les gibiers
- [ ] Export des données en PDF/Excel
- [ ] Graphiques plus avancés (évolution temporelle)
- [ ] Application mobile (React Native)
- [ ] Notifications push pour stock faible
- [ ] Gestion des territoires de chasse
- [ ] Partage de photos et commentaires
- [ ] Mode hors ligne

## 📄 Licence

Ce projet est sous licence MIT.

## 👨‍💻 Auteur

Développé avec ❤️ pour les passionnés de chasse.
