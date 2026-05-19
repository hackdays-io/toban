-- Initial schema for @toban/identity.
-- Mirrors src/schema.ts exactly. D1-compatible (SQLite dialect).

CREATE TABLE identities (
  provider           TEXT NOT NULL,
  account_id         TEXT NOT NULL,
  wallet             TEXT NOT NULL,
  metadata           TEXT,
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL,
  PRIMARY KEY (provider, account_id)
);
CREATE INDEX idx_identities_wallet ON identities(wallet);

CREATE TABLE platform_links (
  provider           TEXT NOT NULL,
  platform_id        TEXT NOT NULL,
  tree_id            TEXT NOT NULL,
  installed_by       TEXT NOT NULL,
  metadata           TEXT,
  created_at         INTEGER NOT NULL,
  PRIMARY KEY (provider, platform_id)
);
CREATE INDEX idx_platform_links_tree ON platform_links(tree_id);

CREATE TABLE used_binding_nonces (
  nonce              BLOB PRIMARY KEY,
  used_at            INTEGER NOT NULL
);
