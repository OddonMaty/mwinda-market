# Migration Mwinda Market vers NitroHost

## Objectifs
- Abandon de Supabase (schéma, Auth, Storage, RLS)
- Abandon de Vercel
- Hébergement sur NitroHost (Node.js + PM2)
- Vrai dashboard administrateur intégré (`/admin`)

## Stack cible proposée
- Next.js 14 (App Router) — conservé
- Base de données : PostgreSQL (via Prisma ou drizzle)
- Auth : NextAuth.js / Auth.js ou session custom + bcrypt
- Stockage images : disque local ou S3-compatible sur le host
- Process manager : PM2

## Modules admin prioritaires
1. File d’attente paiements (valider « J’ai payé »)
2. Gestion des commandes
3. Approbation des candidatures vendeurs
4. Catalogue (produits, photos, masquage)
5. Clients
6. Réglages (numéros Mobile Money, messages)

## Prochaines étapes
- [ ] Créer le schéma Prisma
- [ ] Implémenter Auth réelle
- [ ] Brancher les pages `/admin/*` sur la nouvelle base
- [ ] Adapter le checkout pour paiement manuel
- [ ] Retirer toutes les dépendances Supabase

Branche de travail : `feature/nitro-admin`
