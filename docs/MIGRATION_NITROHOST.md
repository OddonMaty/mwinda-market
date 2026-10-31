# Migration Mwinda Market vers NitroHost

## Objectifs
- Abandon de Supabase (schéma, Auth, Storage, RLS)
- Abandon de Vercel
- Hébergement sur NitroHost (Node.js + PM2)
- Vrai dashboard administrateur intégré (`/admin`)

## Stack cible
- Next.js 14 (App Router)
- **PostgreSQL + Prisma**
- Auth à reconstruire
- Images : stockage local ou S3-compatible
- PM2

## Avancement (branche `feature/nitro-admin`)
- [x] Squelette `/admin`
- [x] Schéma Prisma
- [x] Checkout honnête (Mobile Money manuel + paiement à la livraison)
- [x] Helper Prisma
- [x] **Étape 2** : `/api/orders`, `/api/orders/track` et `/api/seller-applications` réécrits pour Prisma (plus de service_role)
- [x] Protection admin basique préparée dans le middleware
- [ ] Brancher les pages `/admin` sur de vraies requêtes Prisma
- [ ] Auth réelle (remplacer le fallback localStorage)
- [ ] Retirer complètement les dépendances Supabase
- [ ] Migration DB initiale + seed minimal

## Prochaine étape recommandée
Remplir les pages `/admin/commandes` et `/admin/vendeurs` avec des données Prisma, et ajouter les actions « Paiement reçu » / « Approuver vendeur ».
