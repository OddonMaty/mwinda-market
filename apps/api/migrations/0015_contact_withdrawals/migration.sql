-- Comptes sans e-mail (numéro obligatoire à la place), vérification facultative par e-mail / SMS / WhatsApp,
-- numéro WhatsApp de la boutique, retraits des gains des vendeurs.
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ(3);
-- Un numéro identifie un seul compte : celui qui n'a pas d'e-mail, ou celui qui a vérifié le numéro.
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_uq ON users (phone) WHERE phone IS NOT NULL AND (email IS NULL OR phone_verified_at IS NOT NULL);
ALTER TABLE users ADD CONSTRAINT users_contact_chk CHECK (email IS NOT NULL OR phone IS NOT NULL);

ALTER TABLE one_time_tokens DROP CONSTRAINT IF EXISTS one_time_tokens_purpose_check;
ALTER TABLE one_time_tokens ADD CONSTRAINT one_time_tokens_purpose_check CHECK (purpose IN ('verify_email','reset_password','verify_phone','reset_phone'));
ALTER TABLE one_time_tokens ADD COLUMN IF NOT EXISTS attempts SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE shops ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(16) CHECK (whatsapp IS NULL OR whatsapp ~ '^\+[1-9][0-9]{6,14}$');
ALTER TABLE shops ADD COLUMN IF NOT EXISTS notify_whatsapp BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS withdrawals (
  id             CHAR(26) PRIMARY KEY,
  shop_id        CHAR(26) NOT NULL REFERENCES shops(id),
  amount_usd     NUMERIC(12,2) NOT NULL CHECK (amount_usd > 0),
  method         VARCHAR(20) NOT NULL CHECK (method IN ('mobile_money','bank')),
  provider       VARCHAR(60) NOT NULL,
  account_name   VARCHAR(120) NOT NULL,
  account_number VARCHAR(60) NOT NULL,
  status         VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','rejected')),
  reference      VARCHAR(100),
  reason         VARCHAR(300),
  created_at     TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  decided_at     TIMESTAMPTZ(3),
  decided_by     CHAR(26) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS withdrawals_shop ON withdrawals (shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS withdrawals_status ON withdrawals (status, created_at);
