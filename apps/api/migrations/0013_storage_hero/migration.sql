-- Stockage dédié des photos, carrousel d'accueil piloté par l'administrateur, produits de démonstration.
ALTER TABLE uploaded_images ALTER COLUMN bytes DROP NOT NULL;
ALTER TABLE uploaded_images ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE uploaded_images ADD CONSTRAINT uploaded_images_data_chk CHECK (bytes IS NOT NULL OR url IS NOT NULL);

ALTER TABLE plans ADD COLUMN IF NOT EXISTS hero_eligible BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE plans SET hero_eligible = TRUE, features = features || ARRAY['Visibilité sur la page d''accueil (sur sélection)'] WHERE code IN ('pro','premium');

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE products SET is_demo = TRUE WHERE shop_id = '01OFFICIALSHOP000000000000' AND id < 1000;

CREATE TABLE IF NOT EXISTS hero_slides (
  id         CHAR(26) PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  tag        VARCHAR(40)  NOT NULL DEFAULT '',
  title      VARCHAR(120) NOT NULL DEFAULT '',
  text       VARCHAR(300) NOT NULL DEFAULT '',
  image_url  TEXT NOT NULL DEFAULT '',
  price_usd  NUMERIC(12,2),
  link       VARCHAR(300),
  position   INTEGER NOT NULL DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at  TIMESTAMPTZ,
  ends_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hero_slides_position_idx ON hero_slides(position);

INSERT INTO hero_slides(id, product_id, tag, title, text, image_url, position) SELECT * FROM (VALUES
 ('01HEROSLIDE0000000000000A'::char(26), 1::bigint, 'Nouveauté', 'Vinova SmartPhone Pro 12', '108MP de clarté. Vitesse 5G. Batterie toute la journée. Le seul téléphone dont vous avez besoin.', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1400&h=600&fit=crop&auto=format', 0),
 ('01HEROSLIDE0000000000000B', 2, 'Meilleure vente', 'Audio Master Pro XR', '40 heures d''autonomie, réduction active du bruit, un son de qualité studio pour votre quotidien.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&h=600&fit=crop&auto=format', 1),
 ('01HEROSLIDE0000000000000C', 5, 'Offre limitée', 'ProBook 15 Ultra', 'Intel Core i9 · RTX 4070 · 32 Go de RAM. Conçu pour les créateurs qui ne font aucun compromis.', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1400&h=600&fit=crop&auto=format', 2)
) v WHERE EXISTS (SELECT 1 FROM products WHERE id = 1);
