-- Groups schema; user safety and block tables are migration 0005.

CREATE TABLE IF NOT EXISTS groups(id TEXT PRIMARY KEY,organizer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,description TEXT NOT NULL,city TEXT NOT NULL,category TEXT NOT NULL,starts_at INTEGER NOT NULL,place TEXT NOT NULL,cost TEXT NOT NULL,capacity INTEGER NOT NULL CHECK(capacity BETWEEN 2 AND 20),cancelled INTEGER NOT NULL DEFAULT 0 CHECK(cancelled IN(0,1)),created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS group_members(group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,created INTEGER NOT NULL,PRIMARY KEY(group_id,user_id));
CREATE TABLE IF NOT EXISTS group_requests(group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,note TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN('pending','approved','rejected')),created INTEGER NOT NULL,PRIMARY KEY(group_id,user_id));
CREATE INDEX IF NOT EXISTS groups_upcoming ON groups(cancelled,starts_at);
CREATE INDEX IF NOT EXISTS group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS group_requests_user ON group_requests(user_id,state);
CREATE TRIGGER IF NOT EXISTS groups_organizer_member AFTER INSERT ON groups BEGIN INSERT INTO group_members(group_id,user_id,created) VALUES(NEW.id,NEW.organizer_id,NEW.created); END;
CREATE TRIGGER IF NOT EXISTS groups_member_approved AFTER INSERT ON group_members BEGIN UPDATE group_requests SET state='approved' WHERE group_id=NEW.group_id AND user_id=NEW.user_id; END;
CREATE TRIGGER IF NOT EXISTS groups_member_left AFTER DELETE ON group_members BEGIN UPDATE group_requests SET state='rejected' WHERE group_id=OLD.group_id AND user_id=OLD.user_id; END;
