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
- [x] Décrémentation du stock
- [x] Notification stub
- [x] **i18n limité à FR / EN** (`src/i18n/index.ts` mis à jour)
- [ ] Nettoyage final des clés marketing dans `fr.json` et `en.json` (séquestre, etc.) — à finaliser

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
10. Dossier `public/uploads` inscriptible

## Comptes de test
- Admin : `admin@mwinda.market` / `admin123`
- Vendeur : `vendeur@mwinda.market` / `admin123`

## Prochaines étapes
- Finaliser le nettoyage des textes marketing dans les JSON i18n
- Envoi email réel
- Gestion des annulations avec rétablissement du stock
- Amélioration du catalogue
