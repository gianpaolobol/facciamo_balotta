// In-app updates contain only generic kinds and domain references, never message text.
export const NOTIFICATIONS_SCHEMA=`
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
`;
const adult=u=>`EXISTS(SELECT 1 FROM profiles p WHERE p.user_id=${u} AND json_type(p.data,'$.adult')='true') AND NOT EXISTS(SELECT 1 FROM user_safety s WHERE s.user_id=${u} AND s.suspended=1)`;
const clear=(a,b)=>`NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_id=${a} AND b.blocked_id=${b}) OR (b.blocker_id=${b} AND b.blocked_id=${a}))`;
const actor='(SELECT uid FROM actor)';
const pairVisible=`EXISTS(SELECT 1 FROM pairings p WHERE p.id=n.pair_id AND ${actor} IN(p.first_user,p.second_user) AND p.first_decision<>'no' AND p.second_decision<>'no' AND ${adult('p.first_user')} AND ${adult('p.second_user')} AND ${clear('p.first_user','p.second_user')} AND (n.kind='pair' OR (n.kind='message' AND p.first_decision='yes' AND p.second_decision='yes')))`;
const groupVisible=`EXISTS(SELECT 1 FROM groups g WHERE g.id=n.group_id AND g.cancelled=0 AND ${adult('g.organizer_id')} AND ${clear(actor,'g.organizer_id')} AND NOT EXISTS(SELECT 1 FROM group_members m WHERE m.group_id=g.id AND (NOT (${clear(actor,'m.user_id')}) OR NOT (${adult('m.user_id')}))) AND ((n.kind IN('message','approval') AND EXISTS(SELECT 1 FROM group_members m WHERE m.group_id=g.id AND m.user_id=${actor}) AND (n.kind<>'approval' OR g.organizer_id<>${actor})) OR (n.kind='request' AND g.organizer_id=${actor} AND EXISTS(SELECT 1 FROM group_requests r WHERE r.group_id=g.id AND r.state='pending' AND ${adult('r.user_id')} AND ${clear(actor,'r.user_id')}))))`;
const visible=`n.user_id=${actor} AND ${adult(actor)} AND (${pairVisible} OR ${groupVisible})`;
// Shared predicate: transport must select the same currently visible rows as the inbox.
export {visible as NOTIFICATION_VISIBLE_SQL};
const cte='WITH actor AS(SELECT ? AS uid) ';
export function createNotificationsStore({first,all}){
 return {
  eligible:userId=>first(`SELECT id FROM users WHERE id=? AND ${adult('users.id')}`,userId),
  async list(userId){
   const rows=await all(cte+`SELECT n.id,n.kind,n.pair_id,n.group_id,n.created,n.read,SUM(CASE WHEN n.read=0 THEN 1 ELSE 0 END) OVER() AS unread_total FROM notifications n WHERE ${visible} ORDER BY n.id DESC LIMIT 50`,userId);
   return {notifications:rows.map(n=>({id:n.id,kind:n.kind,...(n.pair_id?{pairId:n.pair_id}:{groupId:n.group_id}),created:n.created,read:Boolean(n.read)})),unread:Number(rows[0]?.unread_total||0)};
  },
  markRead:(userId,id)=>first(cte+`UPDATE notifications SET read=1 WHERE id=? AND id IN(SELECT n.id FROM notifications n WHERE ${visible}) RETURNING id`,userId,id),
  markAllRead:userId=>all(cte+`UPDATE notifications SET read=1 WHERE read=0 AND id IN(SELECT n.id FROM notifications n WHERE ${visible}) RETURNING id`,userId)
 };
}
