# Mwinda Market

Place de marché multi-vendeurs panafricaine, lancée en RDC. Monorepo **pnpm**, TypeScript strict.

## Structure

```text
apps/api        API Fastify (Zod, Pino, Helmet, CORS, rate limit), base PostgreSQL (Neon en production)
apps/web        Site Next.js (App Router, React 19), installable en PWA, 5 langues
packages/shared Schémas Zod et types partagés (API et web)
docs/           Parité fonctionnelle, guide des identifiants (e-mail, Google, WhatsApp, SMS)
legacy/         Ancien site PHP/JS, en lecture seule (référence)
```

## Fonctionnalités

- **Acheteurs** : catalogue, recherche, favoris, panier, commande directe avec choix du paiement (à la livraison ou Mobile Money), suivi de colis, messagerie avec les vendeurs, notifications push.
- **Vendeurs** : boutique soumise à validation, produits et photos, commandes, portefeuille et retraits, abonnements (mise en avant, certification), page publique `/boutique/<nom>`.
- **Administration** : validation des boutiques, produits, retraits, abonnements, carrousel d'accueil, pages légales, taux de change.
- **Langues** : français (source), anglais, swahili, chinois, espagnol. Le texte français est la clé dans `apps/web/src/i18n/dict.ts` ; un test vérifie que les 5 langues ont les mêmes clés. Les e-mails sont traduits dans `apps/api/src/mail/templates.ts`.
- **Mobile** : interface type application (barre du bas sur toutes les pages, menu à gauche avec choix de la langue, pied de page minimal).
- **Newsletter** : inscription depuis l'accueil et le pied de page, e-mail de bienvenue, désabonnement par lien (`/desabonnement`).

## Démarrer en local

Prérequis : Node 22 (`.nvmrc`), pnpm 9, Docker (PostgreSQL) ou un PostgreSQL local.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
docker compose up -d            # PostgreSQL 17
pnpm --filter @saotech/api migrate
pnpm dev                        # API :4000, site :3000
```

Le site relaie `/api/*` vers l'API (variable `API_URL`), si bien que navigateur et API partagent la même origine (cookie de session `stm_session`).

## Variables d'environnement de l'API

| Variable | Rôle | Obligatoire |
| :--- | :--- | :--- |
| `DATABASE_URL`, `API_SECRET`, `WEB_ORIGIN` | Base, secret interne, origines autorisées | oui |
| `SMTP_URL`, `MAIL_FROM` | Envoi des e-mails (vérification, commandes, newsletter) | non, e-mails désactivés sinon |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Connexion Google | non |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | WhatsApp (alertes vendeurs, vérification) | non |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | SMS de vérification | non |
| `BLOB_READ_WRITE_TOKEN` | Stockage des photos (Vercel Blob) | non, stockage en base sinon |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Notifications push | non |

Une fonction dont l'identifiant manque reste simplement désactivée. Procédure d'obtention : `docs/GUIDE-IDENTIFIANTS.md`.

## Base de données et migrations

Les migrations sont des fichiers SQL numérotés dans `apps/api/migrations/NNNN_nom/migration.sql`, suivis dans la table `schema_migrations`. Elles ne s'exécutent **pas** au démarrage en production : appliquez-les avant de déployer le code qui en dépend (`pnpm --filter @saotech/api migrate`).

## Déploiement

Deux projets Vercel, déployés automatiquement depuis la branche `main` : le site (`apps/web`) et l'API (`apps/api`, voir `apps/api/DEPLOY.md`).

## Commandes

| Commande | Description |
| :--- | :--- |
| `pnpm dev` | API et site en parallèle |
| `pnpm build` | Compile `shared`, `api` et `web` |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Types stricts sur tous les paquets |
| `pnpm test` | Tests (API sur PostgreSQL en mémoire, site) |

## Pas encore en place

- **Paiements réels** : le Mobile Money est enregistré mais aucun argent ne circule (intégration Flexpaie et séquestre à faire).
- Favoris liés au compte (ils sont aujourd'hui gardés sur l'appareil).

## Principes

- TypeScript strict (`noUncheckedIndexedAccess`), entrées validées par Zod, journaux Pino sans secrets.
- Erreurs d'API au format `{ error: { code, message } }`.
- Protection CSRF par vérification de l'origine sur toute requête modifiante portant un cookie.

Conçu par [Sao Tech Agency](https://saotechagency.com/).
