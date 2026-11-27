-- Cache de traduction automatique (contenus saisis par les boutiques, textes absents du dictionnaire).
CREATE TABLE IF NOT EXISTS translations (
  hash       CHAR(40) NOT NULL,
  lang       VARCHAR(5) NOT NULL,
  source     TEXT NOT NULL,
  target     TEXT NOT NULL,
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  PRIMARY KEY (hash, lang)
);
