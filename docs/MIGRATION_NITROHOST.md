# Migration Mwinda Market vers NitroHost

## Avancement (branche `feature/nitro-admin`)
- [x] Squelette `/admin`
- [x] Schéma Prisma
- [x] Checkout honnête
- [x] Routes API sur Prisma
- [x] Pages admin branchées + actions
- [x] Auth minimale réelle
- [x] Dashboard vendeur + ajout produits
- [x] Suppression Supabase
- [x] Seed + PM2
- [x] Catalogue public sur `/api/catalog`
- [x] Protection `/admin`
- [x] Statuts commande côté vendeur
- [x] **Upload d'images produits** (stockage local `public/uploads/products`)
- [x] Liaison commande → vendeur via product_id

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
10. S'assurer que le dossier `public/uploads` est inscriptible

## Comptes de test
- Admin : `admin@mwinda.market` / `admin123`
- Vendeur : `vendeur@mwinda.market` / `admin123`

## Prochaines étapes
- Notifications (email / WhatsApp) à la nouvelle commande
- Nettoyage des textes marketing restants (i18n)
- Amélioration du catalogue (filtres, pagination)
- Gestion du stock à la commande
