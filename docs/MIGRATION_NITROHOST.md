# Migration Mwinda Market vers NitroHost

## Avancement (branche `feature/nitro-admin`)
- [x] Squelette `/admin`
- [x] Schéma Prisma
- [x] Checkout honnête (Mobile Money manuel + paiement à la livraison)
- [x] Routes API sur Prisma
- [x] Pages admin branchées + actions (Paiement reçu / Approuver vendeur)
- [x] Auth minimale réelle (bcrypt + cookie `mwinda_uid`)
- [x] Dashboard vendeur simplifié + ajout de produits
- [x] Suppression de la dépendance Supabase
- [x] Seed Prisma + config PM2
- [x] **Catalogue public branché** sur `/api/catalog` (Prisma)
- [x] Protection `/admin` renforcée (session requise)

## Déploiement NitroHost
1. Cloner `feature/nitro-admin`
2. `npm install`
3. `.env` avec `DATABASE_URL` (+ optionnel `ADMIN_ACCESS_TOKEN`)
4. `npx prisma migrate dev --name init`
5. `npx prisma generate`
6. `npx prisma db seed`
7. `npm run build`
8. `pm2 start ecosystem.config.js`
9. Nginx + HTTPS

## Comptes de test
- Admin : `admin@mwinda.market` / `admin123`
- Vendeur : `vendeur@mwinda.market` / `admin123`

## Prochaines étapes
- Upload de photos produits (stockage local ou S3)
- Notifications vendeur (email / WhatsApp) à la commande
- Gestion des statuts de commande côté vendeur
- Nettoyage des promesses marketing restantes sur le site public
