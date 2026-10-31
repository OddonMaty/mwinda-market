# Migration Mwinda Market vers NitroHost

## Avancement (branche `feature/nitro-admin`)
- [x] Squelette `/admin`
- [x] Schéma Prisma
- [x] Checkout honnête (Mobile Money manuel + paiement à la livraison)
- [x] Routes API sur Prisma
- [x] Pages admin branchées + actions
- [x] Auth minimale réelle
- [x] Dashboard vendeur + ajout produits (avec URL image)
- [x] Suppression Supabase
- [x] Seed + PM2
- [x] Catalogue public sur `/api/catalog`
- [x] Protection `/admin`
- [x] **Statuts commande côté vendeur** (J'ai le colis → Expédié → Livré)
- [x] Champ image URL sur les produits

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
- Lier automatiquement les commandes au bon vendeur (vendorId) à la création
- Upload de fichiers images (au lieu d'URL)
- Notifications (email / WhatsApp)
- Nettoyage des textes marketing restants sur les pages publiques
