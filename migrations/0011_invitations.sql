-- Hashed identity and contacts only; intentionally survives account deletion.
CREATE TABLE IF NOT EXISTS invitation_batches(
 account_hash TEXT NOT NULL,
 batch_id TEXT NOT NULL,
 fingerprint TEXT NOT NULL,
 contacts TEXT NOT NULL,
 statuses TEXT NOT NULL,
 recipient_count INTEGER NOT NULL CHECK(recipient_count BETWEEN 1 AND 20),
 day TEXT NOT NULL,
 created INTEGER NOT NULL,
 PRIMARY KEY(account_hash,batch_id)
);
CREATE INDEX IF NOT EXISTS invitation_batches_day ON invitation_batches(day,account_hash);
CREATE INDEX IF NOT EXISTS invitation_batches_created ON invitation_batches(created);
