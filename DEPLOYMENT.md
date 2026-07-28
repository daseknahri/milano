# Déploiement sur Coolify

L'application est un service unique : Express sert l'interface compilée, l'API et les médias téléversés sur le port `3008`.

## Configuration recommandée

1. Créez une nouvelle ressource **Application** depuis le dépôt Git.
2. Sélectionnez le build pack **Dockerfile** et exposez le port `3008`.
3. Ajoutez un stockage persistant avec :
   - chemin dans le conteneur : `/app/storage`
   - nom conseillé : `milan-storage`
4. Ajoutez les variables suivantes dans Coolify :

```env
NODE_ENV=production
PORT=3008
HOST=0.0.0.0
STORAGE_DIR=/app/storage
TRUST_PROXY=1
COOKIE_SECURE=true
ADMIN_EMAIL=votre-adresse@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=un-mot-de-passe-long-et-unique
SESSION_SECRET=une-valeur-aleatoire-d-au-moins-32-caracteres
MAX_UPLOAD_MB=20
```

Générez `SESSION_SECRET` localement avec `openssl rand -hex 32` ou un générateur de secrets fiable. Ne commitez jamais le fichier `.env`.

## Domaine et santé

- Le domaine doit pointer vers le port interne `3008`.
- Activez HTTPS dans Coolify ; le cookie d'administration est sécurisé en production.
- Le contrôle de santé est disponible sur `GET /health`.
- Le Dockerfile contient déjà un `HEALTHCHECK`.

## Données persistantes

Au premier démarrage, `server/data/content.seed.json` est copié vers `/app/storage/content.json`. Toutes les modifications de l'administration sont ensuite écrites atomiquement dans ce fichier. Les médias sont enregistrés dans `/app/storage/uploads`.

Le volume `/app/storage` est indispensable : sans lui, le contenu et les médias seraient perdus lors d'un redéploiement. Sauvegardez ce volume depuis Coolify avant toute migration.

## Déploiement avec Docker Compose

Pour un serveur Docker classique :

```bash
cp .env.example .env
# Remplir les trois secrets requis, puis :
docker compose up -d --build
```

Vérification :

```bash
curl http://localhost:3008/health
```

## API d'administration

L'administration utilise un cookie de session `HttpOnly`, `SameSite=Strict`. Les routes d'écriture exigent une connexion via `POST /api/admin/login`. Les images JPEG, PNG, WebP, GIF et les vidéos MP4/WebM sont acceptées par `POST /api/admin/upload` dans le champ multipart `media`, dans la limite configurée par `MAX_UPLOAD_MB`.
