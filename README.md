# Mwinda Market

Plateforme e-commerce panafricaine multi-vendeurs, conçue pour connecter acheteurs et vendeurs à travers l'Afrique subsaharienne.

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Langage | TypeScript |
| Style | Tailwind CSS |
| PWA | next-pwa (service worker, manifest) |
| Fonts | Google Fonts via `next/font` |
| Déploiement | Compatible Vercel / Node.js server |

## Fonctionnalités

- 🛒 Catalogue produits avec filtres par catégorie et boutique
- 🏪 Pages boutiques multi-vendeurs avec profil et inventaire
- 📦 Suivi de commande par référence
- 🗺️ Zones de livraison par pays et province
- 🧾 Panier persistant (Context API)
- 📲 PWA installable (manifest + service worker)
- 🌍 Sélecteur pays / langue dans le header
- 📱 Responsive : mobile (375px), tablette (768px), desktop (1440px)

## Pages (App Router)

```
/                        → Accueil
/produits                → Catalogue produits
/produits/[id]           → Détail produit
/boutiques               → Liste des boutiques
/boutiques/[id]          → Détail boutique
/panier                  → Panier
/suivi                   → Suivi de commande
/suivi/[reference]       → Résultat de suivi
/devenir-vendeur         → Inscription vendeur
/vendeur/dashboard       → Tableau de bord vendeur
/zones-livraison         → Zones et tarifs de livraison
/mentions-legales        → Mentions légales
/confidentialite         → Politique de confidentialité
/conditions              → CGU / CGV
/assistance              → Centre d'aide
/connexion               → Connexion / Inscription
/categories              → Toutes les catégories
```

## Installation locale

```bash
# Cloner le dépôt
git clone https://github.com/OddonMaty/mwinda-market.git
cd mwinda-market

# Installer les dépendances
npm install

# Variables d'environnement (voir .env.example)
# - NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY (serveur uniquement, requis pour /api/orders et candidatures)

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans le navigateur.

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement (port 3000) |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | Lint ESLint |

## Structure du projet

```
src/
├── app/                  # Routes (App Router)
│   ├── layout.tsx        # Layout racine (Header, Footer, fonts)
│   ├── page.tsx          # Page d'accueil
│   ├── produits/
│   ├── boutiques/
│   ├── panier/
│   ├── suivi/
│   ├── vendeur/
│   └── ...
├── components/           # Composants réutilisables
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx
│   ├── ShopCard.tsx
│   └── ...
└── context/              # Context API (panier, etc.)
```

## Notes

- Les fichiers `public/sw.js` et `public/workbox-*.js` sont auto-générés au build (next-pwa) et exclus du dépôt.
- Aucun fichier `.env` n'est inclus dans le dépôt. Créer un `.env.local` pour les variables d'environnement locales.
