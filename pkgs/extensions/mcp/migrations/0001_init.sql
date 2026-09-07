-- Initial schema for @toban/mcp.
-- Mirrors src/schema.ts exactly. D1-compatible (SQLite dialect).

CREATE TABLE mcp_tokens (
  token_id           TEXT PRIMARY KEY,
  tree_id            TEXT NOT NULL,
  label              TEXT NOT NULL,
  created_by         TEXT NOT NULL,
  created_at         INTEGER NOT NULL,
  revoked_at         INTEGER
);
CREATE INDEX idx_mcp_tokens_tree ON mcp_tokens(tree_id);

CREATE TABLE used_mcp_auth_nonces (
  nonce              BLOB PRIMARY KEY,
  used_at            INTEGER NOT NULL
);
