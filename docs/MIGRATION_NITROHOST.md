# Migration Mwinda Market vers NitroHost

## Objectifs
- Abandon de Supabase
- Abandon de Vercel
- Hébergement NitroHost (Node.js + PM2)
- Vrai dashboard administrateur (`/admin`)

## Stack cible
- Next.js 14
- PostgreSQL + Prisma
- Auth à reconstruire
- PM2

## Avancement (branche `feature/nitro-admin`)
- [x] Squelette `/admin`
- [x] Schéma Prisma
- [x] Checkout honnête (Mobile Money manuel + paiement à la livraison)
- [x] Helper Prisma
- [x] Routes API (`/api/orders`, track, seller-applications) sur Prisma
- [x] **Étape 3** : Pages admin branchées sur de vraies données
  - Dashboard : compteurs live
  - `/admin/commandes` : liste + bouton **Paiement reçu** + passage en préparation
  - `/admin/vendeurs` : liste + **Approuver** (crée User + Vendor) / Rejeter
  - Actions serveur dans `src/app/admin/actions.ts`
- [ ] Auth réelle (remplacer fallback localStorage)
- [ ] Retirer complètement Supabase
- [ ] Migration DB initiale + seed
- [ ] Espace vendeur branché sur Prisma
- [ ] Protection admin plus solide

## Prochaine étape recommandée
Mettre en place une auth minimale (ou Auth.js) et retirer le fallback localStorage, puis brancher le dashboard vendeur.
