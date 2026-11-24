-- Notifications push (navigateur / téléphone) et mode de paiement choisi à la commande.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         CHAR(26) PRIMARY KEY,
  user_id    CHAR(26) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  user_agent VARCHAR(200),
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user ON push_subscriptions (user_id);

-- orders.payment_method existe déjà (0004, défaut 'cod') : valeurs 'cod' | 'mobile_money'.
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_chk CHECK (payment_method IN ('cod','mobile_money'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(40);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_phone VARCHAR(16);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(10) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid'));
