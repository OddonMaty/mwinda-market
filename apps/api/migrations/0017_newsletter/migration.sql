-- Newsletter : abonnés (e-mail unique, jeton de désabonnement).
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id              CHAR(26) PRIMARY KEY,
  email           VARCHAR(254) NOT NULL,
  locale          VARCHAR(5) NOT NULL DEFAULT 'fr',
  token           CHAR(32) NOT NULL,
  created_at      TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_email_uq ON newsletter_subscribers (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_token_uq ON newsletter_subscribers (token);
