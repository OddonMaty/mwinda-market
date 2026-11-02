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
- [x] Catalogue public amélioré
- [x] Protection `/admin`
- [x] Statuts commande + notifications
- [x] Décrémentation / rétablissement du stock
- [x] Annulation admin + client
- [x] Emails + WhatsApp
- [x] **Ventes, commissions et retraits**
  - Forfaits : starter 5%, pro 3%, elite 2%
  - Commission calculée à la commande
  - Admin : `/admin/ventes` + `/admin/retraits`
  - Vendeur : `/vendeur/finances` (solde + demande de retrait)
- [x] i18n limité à FR / EN

## Avant déploiement
Après mise à jour du schéma :
```
npx prisma migrate dev --name commissions
# ou
npx prisma db push
```

## Déploiement NitroHost
1. Cloner `feature/nitro-admin`
2. `npm install`
3. `.env` avec `DATABASE_URL` + SMTP + WhatsApp (optionnel)
4. `npx prisma migrate dev --name init` (ou `db push`)
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
- Déploiement sur NitroHost
- Tests bout en bout
- Ajustements UI
