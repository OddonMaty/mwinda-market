-- Tâche 2 : données de référence + journal d'audit (PostgreSQL)
CREATE TABLE currencies (
  code        VARCHAR(3)  PRIMARY KEY,
  name        VARCHAR(80) NOT NULL,
  symbol      VARCHAR(8)  NOT NULL,
  minor_unit  SMALLINT    NOT NULL DEFAULT 2 CHECK (minor_unit BETWEEN 0 AND 4),
  active      BOOLEAN     NOT NULL DEFAULT TRUE
);
CREATE TABLE countries (
  code         VARCHAR(2)  PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  phone_prefix VARCHAR(8)  NOT NULL,
  active       BOOLEAN     NOT NULL DEFAULT FALSE
);
CREATE TABLE country_currencies (
  country_code  VARCHAR(2) NOT NULL REFERENCES countries(code),
  currency_code VARCHAR(3) NOT NULL REFERENCES currencies(code),
  is_default    BOOLEAN    NOT NULL DEFAULT FALSE,
  PRIMARY KEY (country_code, currency_code)
);
CREATE UNIQUE INDEX country_currencies_one_default ON country_currencies (country_code) WHERE is_default;
CREATE TABLE regions (
  id           CHAR(26) PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL REFERENCES countries(code),
  name         VARCHAR(100) NOT NULL,
  slug         VARCHAR(100) NOT NULL,
  UNIQUE (country_code, slug)
);
CREATE TABLE cities (
  id        CHAR(26) PRIMARY KEY,
  region_id CHAR(26) NOT NULL REFERENCES regions(id),
  name      VARCHAR(100) NOT NULL,
  slug      VARCHAR(100) NOT NULL,
  UNIQUE (region_id, slug)
);
CREATE TABLE departments (
  id   CHAR(26) PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE categories (
  id            CHAR(26) PRIMARY KEY,
  department_id CHAR(26) NOT NULL REFERENCES departments(id),
  slug          VARCHAR(80) NOT NULL UNIQUE,
  name          VARCHAR(100) NOT NULL,
  sort          INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE audit_log (
  id          CHAR(26) PRIMARY KEY,
  actor_id    CHAR(26),
  action      VARCHAR(80) NOT NULL,
  target_type VARCHAR(40) NOT NULL,
  target_id   VARCHAR(40) NOT NULL,
  before      JSONB,
  after       JSONB,
  ip          VARCHAR(45),
  created_at  TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_target ON audit_log (target_type, target_id);
CREATE INDEX audit_log_actor  ON audit_log (actor_id, created_at);

-- Journal immuable : ni modification, ni suppression, ni vidage.
CREATE FUNCTION audit_log_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log est immuable (% interdit)', TG_OP USING ERRCODE = 'integrity_constraint_violation';
END $$;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
CREATE TRIGGER audit_log_no_truncate BEFORE TRUNCATE ON audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_immutable();
