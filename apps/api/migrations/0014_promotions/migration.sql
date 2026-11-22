-- Promotions : un produit promu peut figurer dans le carrousel (hero) et/ou dans la section « À la une » de l'accueil.
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS placement VARCHAR(10) NOT NULL DEFAULT 'hero';
ALTER TABLE hero_slides ADD CONSTRAINT hero_slides_placement_chk CHECK (placement IN ('hero','home'));
UPDATE plans SET features = array_replace(features, 'Visibilité sur la page d''accueil (sur sélection)', 'Promotion de vos produits sur la plateforme (sur sélection)') WHERE hero_eligible;
-- Tout abonnement payant ouvre droit aux promotions (l'administrateur reste seul à choisir les produits promus).
UPDATE plans SET hero_eligible = TRUE, features = features || ARRAY['Promotion de vos produits sur la plateforme (sur sélection)'] WHERE price_usd > 0 AND NOT ('Promotion de vos produits sur la plateforme (sur sélection)' = ANY(features));
