# Migration Mwinda Market vers NitroHost

## Objectifs
- Abandon de Supabase (schéma, Auth, Storage, RLS)
- Abandon de Vercel
- Hébergement sur NitroHost (Node.js + PM2)
- Vrai dashboard administrateur intégré (`/admin`)

## Stack cible
- Next.js 14 (App Router)
- **PostgreSQL + Prisma** (schéma dans `prisma/schema.prisma`)
- Auth à reconstruire (Auth.js ou sessions custom)
- Images : stockage local ou S3-compatible
- PM2

## Avancement (branche `feature/nitro-admin`)
- [x] Squelette `/admin` (layout + pages commandes, vendeurs, catalogue, réglages)
- [x] Schéma Prisma de base (User, Vendor, Product, Order, OrderItem, SellerApplication, Setting)
- [x] Checkout honnête : modes **Mobile Money manuel** et **Paiement à la livraison** (plus de faux escrow / carte)
- [x] Helper Prisma (`src/lib/prisma.ts`)
- [ ] Brancher les API routes sur Prisma
- [ ] Protéger `/admin`
- [ ] Auth réelle
- [ ] Retirer complètement Supabase

## Prochaine étape recommandée
Adapter `/api/orders` pour écrire dans Prisma au lieu de Supabase, puis faire de même pour les candidatures vendeurs.
