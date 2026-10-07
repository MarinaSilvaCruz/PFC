CREATE TABLE IF NOT EXISTS locais (
  id           SERIAL PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  nome         TEXT NOT NULL,
  bairro       TEXT NOT NULL DEFAULT '',
  endereco     TEXT NOT NULL DEFAULT '',
  descricao    TEXT NOT NULL DEFAULT '',
  foto_qr_url  TEXT NOT NULL DEFAULT '',
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  raio_m       INTEGER NOT NULL DEFAULT 150 CHECK (raio_m > 0),
  token        TEXT NOT NULL UNIQUE,
  ordem        INTEGER NOT NULL DEFAULT 0,
  ativo        BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS participantes (
  id                   SERIAL PRIMARY KEY,
  email                TEXT NOT NULL UNIQUE,
  nome                 TEXT,
  telefone             TEXT NOT NULL,
  cidade               TEXT NOT NULL,
  estado               CHAR(2) NOT NULL,
  instagram            TEXT,
  consentimento_em     TIMESTAMPTZ NOT NULL,
  email_verificado_em  TIMESTAMPTZ,
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessoes (
  token_hash       TEXT PRIMARY KEY,
  participante_id  INTEGER NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_em        TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sessoes_participante_idx ON sessoes (participante_id);

CREATE TABLE IF NOT EXISTS codigos (
  id           SERIAL PRIMARY KEY,
  email        TEXT NOT NULL,
  codigo_hash  TEXT NOT NULL,
  tentativas   INTEGER NOT NULL DEFAULT 0,
  expira_em    TIMESTAMPTZ NOT NULL,
  usado_em     TIMESTAMPTZ,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS codigos_email_idx ON codigos (email, criado_em DESC);

CREATE TABLE IF NOT EXISTS carimbos (
  participante_id  INTEGER NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
  local_id         INTEGER NOT NULL REFERENCES locais(id) ON DELETE CASCADE,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT now(),
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  precisao         DOUBLE PRECISION,
  PRIMARY KEY (participante_id, local_id)
);
