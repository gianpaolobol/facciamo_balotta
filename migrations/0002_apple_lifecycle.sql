CREATE TABLE IF NOT EXISTS apple_account_state(subject TEXT PRIMARY KEY, revoked_at INTEGER NOT NULL DEFAULT 0, email_event_time INTEGER NOT NULL DEFAULT 0, email_enabled INTEGER);
CREATE TABLE IF NOT EXISTS apple_notifications(id TEXT PRIMARY KEY, expires INTEGER NOT NULL, processed INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS apple_notifications_expiry ON apple_notifications(expires);
