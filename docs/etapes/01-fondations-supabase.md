# Fiche d'étape 1 : Fondations Supabase, Sécurité et Données Initiales

## 1. Ce qui a été fait automatiquement
- **Vérification du code source** : confirmation qu'aucune requête n'interrogeait directement les tables sensibles (`orders`, `order_items`, `seller_applications`, `vendors`).
- **Durcissement de la sécurité (Migration 0002)** :
  - Suppression des politiques publiques et anonymes sur `orders` et `order_items` (accès direct navigateur fermé).
  - Suppression des politiques sur `seller_applications` (accès direct fermé en attente de l'API dédiée).
  - Verrouillage de la table `vendors` : un vendeur ne peut lire que son propre profil (`user_id = auth.uid()`).
  - Sécurisation de la fonction `is_vendor_of_shop` (`SECURITY DEFINER` avec chemin d'accès fixé sur le schéma public).
  - Mise en place de déclencheurs automatiques (`triggers`) empêchant les vendeurs de falsifier ou modifier les champs réservés à la plateforme sur `shops` (`verified`, `top_seller`, `featured`, `rating`, `review_count`, `is_active`, `is_demo`) et sur `products` (`rating`, `review_count`, `is_active`, `is_demo`).
- **Audit de sécurité Supabase (Advisors)** : exécution de l'audit et correction des avertissements sur les fonctions et chemins de recherche.
- **Synchronisation TypeScript** : génération automatique du fichier `src/types/supabase.ts` depuis le schéma réel de la base et ajustement du mapping du catalogue dans `CatalogContext.tsx`.
- **Peuplement des données de démonstration (Seed)** : injection complète via MCP des pays (54), régions/provinces (55), boutiques (15), produits (42), galerie d'images (4) et avis clients (4) avec les indicateurs `is_demo = true` et `is_active = true`.

## 2. Ce que vous devez faire vous-même
Aucune action manuelle.

## 3. Comment vérifier que ça a marché
1. Rendez-vous sur votre tableau de bord **Supabase** dans votre navigateur.
2. Cliquez sur l'icône **Table Editor** dans le menu de gauche :
   - Sélectionnez la table **countries** : vous devez voir **54 lignes**.
   - Sélectionnez la table **regions** : vous devez voir **55 lignes**.
   - Sélectionnez la table **shops** : vous devez voir **15 lignes**, toutes avec `is_active = true` et `is_demo = true`.
   - Sélectionnez la table **products** : vous devez voir **42 lignes**, toutes avec `is_active = true` et `is_demo = true`.
   - Sélectionnez la table **product_images** : vous devez voir **4 lignes** (galerie de la station solaire).
   - Sélectionnez la table **product_reviews** : vous devez voir **4 lignes** (avis de la station solaire).
   - Les tables **orders**, **order_items**, **seller_applications** et **vendors** doivent afficher **0 ligne**.
3. Cliquez sur **Authentication** puis **Policies** dans le menu de gauche :
   - Vérifiez que `orders` ne dispose plus d'accès public anonyme en lecture ou écriture.
   - Vérifiez que `order_items` et `seller_applications` ont RLS activé sans politique ouverte.
   - Vérifiez que `vendors` applique la règle stricte `user_id = auth.uid()`.

## 4. Ce que vous ne devez surtout pas faire
- Ne désactivez pas le commutateur **RLS (Row Level Security)** sur les tables de la base de données.
- Ne modifiez pas manuellement les déclencheurs de protection (`trg_protect_shop_platform_fields` et `trg_protect_product_platform_fields`).
- Ne partagez jamais votre clé secrète `service_role` dans le code ou les messages.
- Ne commitez pas les fichiers temporaires de contournement SWC/WASM dans Git.

## 5. Ce que vous devez me renvoyer (ou envoyer à votre conseiller)
- Une capture d'écran de l'écran **Table Editor** montrant les tables `shops` et `products` avec leurs lignes.
- La confirmation que l'affichage de vos tables correspond bien aux comptages attendus.
