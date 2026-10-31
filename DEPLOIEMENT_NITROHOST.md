# Guide de déploiement Mwinda Market sur NitroHost

Branche : `feature/nitro-admin`

## Prérequis
- Compte NitroHost avec accès SSH ou panneau Node.js
- Base PostgreSQL créée sur NitroHost (ou externe)
- Domaine pointant vers le serveur (ex: mwinda.market)
- Node.js 18+ et npm sur le serveur

## Étape 1 — Préparer le serveur
```bash
# Connexion SSH
ssh user@votre-serveur-nitrohost

# Créer le dossier
mkdir -p ~/mwinda-market
cd ~/mwinda-market

# Cloner la branche
git clone -b feature/nitro-admin https://github.com/OddonMaty/mwinda-market.git .
```

## Étape 2 — Installer les dépendances
```bash
npm install
```

## Étape 3 — Configurer l'environnement
Crée le fichier `.env` :
```bash
nano .env
```

Contenu minimum :
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/mwinda?schema=public"
NODE_ENV=production
PORT=3000

# Optionnel mais recommandé
ADMIN_ACCESS_TOKEN=un-token-secret-long
SMTP_HOST=smtp.votre-domaine.com
SMTP_PORT=587
SMTP_USER=noreply@mwinda.market
SMTP_PASS=mot-de-passe-smtp
SMTP_FROM="Mwinda Market <noreply@mwinda.market>"
ADMIN_EMAIL=admin@mwinda.market

# WhatsApp (optionnel)
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
```

## Étape 4 — Base de données
```bash
npx prisma generate
npx prisma db push
# ou : npx prisma migrate dev --name init

npx prisma db seed
```

Comptes de test après seed :
- Admin : admin@mwinda.market / admin123
- Vendeur : vendeur@mwinda.market / admin123

## Étape 5 — Build
```bash
npm run build
```

## Étape 6 — Démarrer avec PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Étape 7 — Nginx (reverse proxy)
Exemple de configuration `/etc/nginx/sites-available/mwinda` :
```nginx
server {
    listen 80;
    server_name mwinda.market www.mwinda.market;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads/ {
        alias /home/user/mwinda-market/public/uploads/;
        expires 30d;
    }
}
```

Activer :
```bash
sudo ln -s /etc/nginx/sites-available/mwinda /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Étape 8 — HTTPS
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d mwinda.market -d www.mwinda.market
```

## Étape 9 — Permissions uploads
```bash
mkdir -p public/uploads/products
chmod -R 755 public/uploads
chown -R $USER:$USER public/uploads
```

## Étape 10 — Vérifications
1. Ouvrir https://mwinda.market
2. Tester le hero (carrousel d'images)
3. Créer un compte / se connecter
4. Passer une commande test
5. Vérifier `/admin` (avec le token si configuré)
6. Vérifier `/vendeur/finances`
7. Vérifier `/admin/ventes` et `/admin/retraits`

## Commandes utiles
```bash
pm2 logs mwinda-market
pm2 restart mwinda-market
pm2 status
```

## Notes
- Les images uploadées sont dans `public/uploads/products` (format WebP).
- Le catalogue public charge les produits depuis Prisma via `/api/catalog`.
- Les commissions sont calculées selon le forfait vendeur (starter 5%, pro 3%, elite 2%).
- Les retraits se font via `/vendeur/finances` et sont validés dans `/admin/retraits`.

## En cas de problème
- Vérifier les logs : `pm2 logs`
- Vérifier la connexion DB : `npx prisma studio` (local) ou logs
- S'assurer que `DATABASE_URL` est correct
- Vérifier que le port 3000 n'est pas déjà utilisé
