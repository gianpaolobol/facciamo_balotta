CREATE TABLE IF NOT EXISTS user_blocks(blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,created INTEGER NOT NULL,PRIMARY KEY(blocker_id,blocked_id),CHECK(blocker_id<>blocked_id));
CREATE TABLE IF NOT EXISTS user_safety(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,suspended INTEGER NOT NULL DEFAULT 0 CHECK(suspended IN(0,1)));
CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,pair_id TEXT REFERENCES pairings(id) ON DELETE CASCADE,group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 1000),created INTEGER NOT NULL,CHECK((pair_id IS NULL)<>(group_id IS NULL)));
CREATE INDEX IF NOT EXISTS messages_pair ON messages(pair_id,created,id);
CREATE INDEX IF NOT EXISTS messages_group ON messages(group_id,created,id);
CREATE INDEX IF NOT EXISTS messages_sender ON messages(sender_id,created);
CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,target_group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,target_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,reason TEXT NOT NULL CHECK(length(reason) BETWEEN 1 AND 1000),created INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS reports_created ON reports(created,id);
