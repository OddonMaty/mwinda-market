# Migration Mwinda Market vers NitroHost

## Avancement (branche `feature/nitro-admin`)
- [x] Squelette `/admin`
- [x] Schéma Prisma
- [x] Checkout honnête
- [x] Routes API sur Prisma
- [x] Pages admin branchées + actions
- [x] Auth minimale réelle (bcrypt + cookie)
- [x] Dashboard vendeur simplifié
- [x] **Étape 5** : Suppression de la dépendance Supabase
  - `@supabase/supabase-js` retiré de `package.json`
  - Clients Supabase stubbés (retournent null)
  - Seed Prisma (`prisma/seed.ts`) avec admin + vendeur de test
  - Config PM2 (`ecosystem.config.js`) pour NitroHost

## Déploiement NitroHost (checklist)
1. Cloner la branche `feature/nitro-admin`
2. `npm install`
3. Créer `.env` avec `DATABASE_URL=postgresql://...`
4. `npx prisma migrate dev --name init` (ou `prisma db push`)
5. `npx prisma generate`
6. `npx prisma db seed`
7. `npm run build`
8. `pm2 start ecosystem.config.js`
9. Configurer Nginx + HTTPS + domaine

## Comptes de test (après seed)
- Admin : `admin@mwinda.market` / `admin123`
- Vendeur : `vendeur@mwinda.market` / `admin123`

## Prochaines étapes
- Brancher le catalogue public sur Prisma (au lieu des données statiques)
- Gestion produits côté vendeur (ajout + photo)
- Protection admin plus solide
- Notifications (email / WhatsApp)
