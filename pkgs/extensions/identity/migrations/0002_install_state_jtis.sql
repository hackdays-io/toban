-- Issue #509 review #4: single-use OAuth-install state-JWT jti table.
-- See src/schema.ts:usedInstallStateJtis for the matching Drizzle table.

CREATE TABLE used_install_state_jtis (
  jti     TEXT PRIMARY KEY,
  used_at INTEGER NOT NULL
);
