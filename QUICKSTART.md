# 🚀 Quick Start - Chasse App

Guide de démarrage rapide pour lancer l'application en 5 minutes.

## Prérequis

- Docker et Docker Compose installés
- Ports 3000, 8000 et 5432 disponibles

## Démarrage en 3 Étapes

### 1. Démarrer tous les services

```bash
docker-compose up -d
```

Cette commande va :
- Créer et démarrer la base de données PostgreSQL
- Créer et démarrer le backend FastAPI
- Créer et démarrer le frontend Next.js
- Exécuter les migrations de base de données automatiquement

**⏱ Temps d'attente : 2-3 minutes** (le temps que les images Docker se construisent et que les services démarrent)

### 2. Peupler la base de données avec des données de test

```bash
docker-compose exec backend python seed_data.py
```

Cela va créer :
- 4 utilisateurs (1 admin + 3 chasseurs)
- 5 types de cartouches
- Plusieurs achats et utilisations
- 12 espèces de gibier
- 7 gibiers enregistrés

### 3. Ouvrir l'application

**Frontend** : http://localhost:3000
**Backend API Docs** : http://localhost:8000/docs

## Connexion

Utilisez un des comptes de test :

### Admin
- **Email** : `admin@chasse.fr`
- **Password** : `admin123`

### Chasseurs
- **Jean Dupont** : `jean.dupont@chasse.fr` / `password123`
- **Pierre Martin** : `pierre.martin@chasse.fr` / `password123`
- **Paul Durand** : `paul.durand@chasse.fr` / `password123`

## Vérification

### Vérifier que tous les services sont démarrés

```bash
docker-compose ps
```

Vous devriez voir 3 services en état "Up" :
- chasse_db
- chasse_backend
- chasse_frontend

### Voir les logs en temps réel

```bash
# Tous les services
docker-compose logs -f

# Backend uniquement
docker-compose logs -f backend

# Frontend uniquement
docker-compose logs -f frontend
```

## Arrêt et Redémarrage

### Arrêter l'application

```bash
docker-compose down
```

### Redémarrer l'application

```bash
docker-compose up -d
```

### Redémarrer avec reconstruction des images

```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### Réinitialiser complètement (⚠️ supprime toutes les données)

```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend python seed_data.py
```

## Développement Local (Sans Docker)

Si vous préférez développer sans Docker :

### Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Copier et configurer .env
cp .env.example .env
# Modifier DATABASE_URL pour pointer vers votre PostgreSQL local

# Exécuter les migrations
alembic upgrade head

# Peupler la base
python seed_data.py

# Démarrer le serveur
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

## Problèmes Courants

### Le port 3000 est déjà utilisé

```bash
# Trouver le processus qui utilise le port
lsof -i :3000

# Ou modifier le port dans docker-compose.yml
ports:
  - "3001:3000"  # Utilise le port 3001 localement
```

### Le backend ne se connecte pas à la base de données

```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps db

# Voir les logs de la base
docker-compose logs db

# Redémarrer juste la base
docker-compose restart db
```

### Erreur "Cannot connect to backend"

```bash
# Vérifier que le backend est démarré
docker-compose ps backend

# Voir les logs
docker-compose logs backend

# Vérifier l'URL de l'API dans le frontend
# Elle doit être http://localhost:8000
```

### Les migrations ne s'exécutent pas

```bash
# Exécuter manuellement les migrations
docker-compose exec backend alembic upgrade head
```

### Tout réinitialiser

```bash
# Supprimer tous les conteneurs et volumes
docker-compose down -v

# Supprimer les images
docker-compose down --rmi all

# Reconstruire from scratch
docker-compose build --no-cache
docker-compose up -d
docker-compose exec backend python seed_data.py
```

## Accès aux Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Application Next.js |
| Backend API | http://localhost:8000 | API FastAPI |
| API Docs (Swagger) | http://localhost:8000/docs | Documentation interactive |
| API Docs (ReDoc) | http://localhost:8000/redoc | Documentation alternative |
| PostgreSQL | localhost:5432 | Base de données |

## Prochaines Étapes

1. **Explorer l'application**
   - Connectez-vous avec un compte de test
   - Naviguez dans les différentes sections
   - Testez les fonctionnalités

2. **Personnaliser**
   - Modifiez les couleurs dans `frontend/tailwind.config.js`
   - Ajoutez des espèces de gibier personnalisées
   - Créez vos propres chasseurs

3. **Développer**
   - Ajoutez des graphiques avec Recharts
   - Implémentez les formulaires manquants
   - Créez de nouvelles fonctionnalités

4. **Déployer**
   - Configurez les variables d'environnement pour la production
   - Utilisez un service comme Railway, Render ou Vercel
   - Configurez un nom de domaine

## Support

- Documentation complète : Voir `README.md`
- Structure du projet : Voir `STRUCTURE.md`
- API Documentation : http://localhost:8000/docs

## Commandes Utiles

```bash
# Voir l'état des services
docker-compose ps

# Voir les logs
docker-compose logs -f

# Exécuter une commande dans un conteneur
docker-compose exec backend python seed_data.py
docker-compose exec backend alembic revision --autogenerate -m "Description"

# Accéder à la console PostgreSQL
docker-compose exec db psql -U chasse_user -d chasse_db

# Backup de la base
docker-compose exec db pg_dump -U chasse_user chasse_db > backup.sql

# Restauration
docker-compose exec -T db psql -U chasse_user chasse_db < backup.sql

# Nettoyer tout
docker-compose down -v --rmi all
```

Bon développement ! 🦌🎯
