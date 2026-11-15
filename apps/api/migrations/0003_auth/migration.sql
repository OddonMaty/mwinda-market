-- Tâche 3 : comptes, rôles d'administration, sessions, jetons à usage unique.
-- Aucun mot de passe ni jeton en clair : seuls des hash sont enregistrés.
CREATE TABLE users (
  id                CHAR(26) PRIMARY KEY,
  email             VARCHAR(254) NOT NULL UNIQUE CHECK (email = lower(email)),
  email_verified_at TIMESTAMPTZ(3),
  password_hash     TEXT,
  google_sub        VARCHAR(64) UNIQUE,
  first_name        VARCHAR(80) NOT NULL,
  last_name         VARCHAR(80) NOT NULL,
  phone             VARCHAR(16) CHECK (phone ~ '^\+[1-9][0-9]{6,14}$'),
  country_code      VARCHAR(2) REFERENCES countries(code),
  city_id           CHAR(26) REFERENCES cities(id),
  locale            VARCHAR(5) NOT NULL DEFAULT 'fr',
  status            VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  last_login_at     TIMESTAMPTZ(3),
  created_at        TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);

CREATE TABLE admin_roles (
  user_id CHAR(26) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role    VARCHAR(12) NOT NULL CHECK (role IN ('moderator','finance','superadmin')),
  PRIMARY KEY (user_id, role)
);

CREATE TABLE sessions (
  id           CHAR(26) PRIMARY KEY,
  user_id      CHAR(26) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   CHAR(64) NOT NULL UNIQUE,
  kind         VARCHAR(3) NOT NULL CHECK (kind IN ('web','api')),
  ip           VARCHAR(45),
  user_agent   VARCHAR(300),
  created_at   TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ(3) NOT NULL,
  revoked_at   TIMESTAMPTZ(3),
  last_used_at TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user ON sessions (user_id);

CREATE TABLE one_time_tokens (
  id         CHAR(26) PRIMARY KEY,
  user_id    CHAR(26) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose    VARCHAR(14) NOT NULL CHECK (purpose IN ('verify_email','reset_password')),
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ(3) NOT NULL,
  used_at    TIMESTAMPTZ(3)
);
CREATE INDEX one_time_tokens_user ON one_time_tokens (user_id, purpose);
