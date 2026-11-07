-- In-app notifications; requires users, pairings, groups, memberships, requests and messages.

CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,pair_id TEXT REFERENCES pairings(id) ON DELETE CASCADE,group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,kind TEXT NOT NULL CHECK(kind IN('pair','message','request','approval')),created INTEGER NOT NULL,read INTEGER NOT NULL DEFAULT 0 CHECK(read IN(0,1)),CHECK((pair_id IS NULL)<>(group_id IS NULL)));
CREATE INDEX IF NOT EXISTS notifications_recipient ON notifications(user_id,id DESC);
CREATE TRIGGER IF NOT EXISTS notifications_trim AFTER INSERT ON notifications BEGIN DELETE FROM notifications WHERE user_id=NEW.user_id AND id NOT IN(SELECT id FROM notifications WHERE user_id=NEW.user_id ORDER BY id DESC LIMIT 100); END;
CREATE TRIGGER IF NOT EXISTS notifications_new_pair AFTER INSERT ON pairings BEGIN INSERT INTO notifications(user_id,pair_id,kind,created) VALUES(NEW.first_user,NEW.id,'pair',NEW.created),(NEW.second_user,NEW.id,'pair',NEW.created); END;
CREATE TRIGGER IF NOT EXISTS notifications_new_message AFTER INSERT ON messages BEGIN
 INSERT INTO notifications(user_id,pair_id,kind,created) SELECT CASE WHEN p.first_user=NEW.sender_id THEN p.second_user ELSE p.first_user END,p.id,'message',NEW.created FROM pairings p WHERE p.id=NEW.pair_id AND NEW.sender_id IN(p.first_user,p.second_user);
 INSERT INTO notifications(user_id,group_id,kind,created) SELECT m.user_id,m.group_id,'message',NEW.created FROM group_members m WHERE m.group_id=NEW.group_id AND m.user_id<>NEW.sender_id;
END;
CREATE TRIGGER IF NOT EXISTS notifications_new_request AFTER INSERT ON group_requests WHEN NEW.state='pending' BEGIN INSERT INTO notifications(user_id,group_id,kind,created) SELECT g.organizer_id,g.id,'request',NEW.created FROM groups g WHERE g.id=NEW.group_id AND g.organizer_id<>NEW.user_id; END;
CREATE TRIGGER IF NOT EXISTS notifications_renewed_request AFTER UPDATE OF state ON group_requests WHEN NEW.state='pending' AND OLD.state<>'pending' BEGIN INSERT INTO notifications(user_id,group_id,kind,created) SELECT g.organizer_id,g.id,'request',NEW.created FROM groups g WHERE g.id=NEW.group_id AND g.organizer_id<>NEW.user_id; END;
CREATE TRIGGER IF NOT EXISTS notifications_approved_member AFTER INSERT ON group_members BEGIN INSERT INTO notifications(user_id,group_id,kind,created) SELECT NEW.user_id,g.id,'approval',NEW.created FROM groups g WHERE g.id=NEW.group_id AND g.organizer_id<>NEW.user_id; END;
