-- Optional native push; no provider credentials or schedules.

CREATE TABLE IF NOT EXISTS push_devices(installation_id TEXT PRIMARY KEY,proof_hash TEXT NOT NULL,device_key TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,session_hash TEXT NOT NULL REFERENCES sessions(hash) ON DELETE CASCADE,token_cipher TEXT NOT NULL,token_hash TEXT NOT NULL UNIQUE,project_id TEXT NOT NULL,version TEXT NOT NULL,cursor INTEGER NOT NULL,created INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS push_devices_user ON push_devices(user_id);
CREATE TABLE IF NOT EXISTS push_attempts(id TEXT PRIMARY KEY,device_key TEXT NOT NULL,version TEXT NOT NULL,notification_id INTEGER NOT NULL,day TEXT NOT NULL,created INTEGER NOT NULL,state TEXT NOT NULL CHECK(state IN('reserved','ticket','checking','receipt_ok','failed','expired')),ticket_id TEXT,receipt_after INTEGER,UNIQUE(version,notification_id));
CREATE INDEX IF NOT EXISTS push_attempts_day ON push_attempts(day,device_key);
CREATE INDEX IF NOT EXISTS push_attempts_receipts ON push_attempts(state,receipt_after);
CREATE TRIGGER IF NOT EXISTS push_attempt_cursor AFTER INSERT ON push_attempts BEGIN UPDATE push_devices SET cursor=MAX(cursor,NEW.notification_id) WHERE version=NEW.version; END;
