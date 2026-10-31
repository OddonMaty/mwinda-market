# Migration Mwinda Market vers NitroHost

## Avancement (branche `feature/nitro-admin`)
- [x] Squelette `/admin`
- [x] Schéma Prisma
- [x] Checkout honnête
- [x] Routes API sur Prisma
- [x] Pages admin branchées + actions
- [x] Auth minimale réelle
- [x] Dashboard vendeur + ajout produits + upload images
- [x] Suppression Supabase
- [x] Seed + PM2
- [x] Catalogue public sur `/api/catalog`
- [x] Protection `/admin`
- [x] Statuts commande côté vendeur
- [x] Décrémentation / rétablissement du stock
- [x] Annulation de commande
- [x] **Notifications email réelles** (Nodemailer)
- [x] i18n limité à FR / EN + nettoyage des principales promesses marketing

## Email
Configure dans `.env` :
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="Mwinda Market <noreply@mwinda.market>"
ADMIN_EMAIL=admin@mwinda.market
```
Un email est envoyé à `ADMIN_EMAIL` à chaque nouvelle commande.

## Déploiement NitroHost
1. Cloner `feature/nitro-admin`
2. `npm install`
3. `.env` avec `DATABASE_URL` + SMTP + `ADMIN_ACCESS_TOKEN`
4. `npx prisma migrate dev --name init`
5. `npx prisma generate`
6. `npx prisma db seed`
7. `npm run build`
8. `pm2 start ecosystem.config.js`
9. Nginx + HTTPS
10. Dossier `public/uploads` inscriptible

## Comptes de test
- Admin : `admin@mwinda.market` / `admin123`
- Vendeur : `vendeur@mwinda.market` / `admin123`

## Prochaines étapes
- Email au vendeur (en plus de l'admin)
- Bouton d'annulation côté client
- Amélioration du catalogue
- Notifications WhatsApp
