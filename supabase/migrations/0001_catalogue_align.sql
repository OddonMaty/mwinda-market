-- Migration 0001 : Alignement catalogue Mwinda Market (partie sûre uniquement)
-- Basé sur 20261025144302_mwinda_market_core_schema (déjà appliqué, vide)
-- ⚠️  N'ajoute PAS products.images (remplacé par product_images) ni shops.vendor_id
--     (lien boutique-vendeur déjà géré via la table vendors). Voir migration 0002.

-- 1. Traçabilité démo : colonne is_demo sur shops, products, product_reviews
ALTER TABLE IF EXISTS public.shops
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS public.product_reviews
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- 2. Index de performance pour les filtres catalogue (catégorie, boutique, pays, province)
CREATE INDEX IF NOT EXISTS idx_products_category    ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_shop_id     ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_province    ON public.products(province);
CREATE INDEX IF NOT EXISTS idx_products_is_active   ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_demo     ON public.products(is_demo);

CREATE INDEX IF NOT EXISTS idx_shops_country_code   ON public.shops(country_code);
CREATE INDEX IF NOT EXISTS idx_shops_category       ON public.shops(category);
CREATE INDEX IF NOT EXISTS idx_shops_province       ON public.shops(province);
CREATE INDEX IF NOT EXISTS idx_shops_is_active      ON public.shops(is_active);
CREATE INDEX IF NOT EXISTS idx_shops_is_demo        ON public.shops(is_demo);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id  ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);

-- 3. Commentaires documentant les tables
COMMENT ON TABLE public.shops          IS 'Boutiques partenaires panafricaines (Kinshasa, Brazzaville, Kigali, etc.)';
COMMENT ON TABLE public.products       IS 'Catalogue de produits rattachés aux boutiques, avec spécifications et badges logistiques';
COMMENT ON TABLE public.product_images IS 'Galerie d''images complémentaires pour chaque produit';
COMMENT ON TABLE public.product_reviews IS 'Avis vérifiés et retours d''expérience clients par produit';
