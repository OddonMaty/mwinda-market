-- Photos envoyées par les vendeurs (stockées en base, servies par l'API). Compressées côté navigateur (~200 Ko).
CREATE TABLE uploaded_images (
  id           CHAR(26) PRIMARY KEY,
  shop_id      CHAR(26) NOT NULL REFERENCES shops(id),
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/webp')),
  bytes        BYTEA NOT NULL,
  size         INTEGER NOT NULL CHECK (size BETWEEN 1 AND 1500000),
  created_at   TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);
CREATE INDEX uploaded_images_shop_idx ON uploaded_images(shop_id);
