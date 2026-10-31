# Migration Mwinda Market vers NitroHost

## Avancement (branche `feature/nitro-admin`)
- [x] Squelette `/admin`
- [x] Schéma Prisma
- [x] Checkout honnête
- [x] Routes API sur Prisma
- [x] Pages admin branchées + actions
- [x] **Étape 4** : Auth minimale réelle
  - Routes `/api/auth/signup`, `/login`, `/me`, `/logout`
  - Mot de passe hashé (bcryptjs)
  - Cookie `mwinda_uid` (httpOnly)
  - `AuthContext` réécrit : plus de fallback localStorage, plus de Supabase
  - Dashboard vendeur simplifié branché sur Prisma (commandes + produits de sa boutique)
- [ ] Retirer complètement les dépendances Supabase
- [ ] Protection admin plus solide
- [ ] Gestion produits côté vendeur (ajout/photo)
- [ ] Migration DB initiale + seed

## Prochaine étape recommandée
Retirer Supabase du projet, ajouter un seed minimal, et préparer le déploiement NitroHost (PM2 + .env).
