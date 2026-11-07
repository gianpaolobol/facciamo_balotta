export const COMMUNITY_SCHEMA=`
CREATE TABLE IF NOT EXISTS user_blocks(blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,created INTEGER NOT NULL,PRIMARY KEY(blocker_id,blocked_id),CHECK(blocker_id<>blocked_id));
CREATE TABLE IF NOT EXISTS user_safety(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,suspended INTEGER NOT NULL DEFAULT 0 CHECK(suspended IN(0,1)));
CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,pair_id TEXT REFERENCES pairings(id) ON DELETE CASCADE,group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 1000),created INTEGER NOT NULL,CHECK((pair_id IS NULL)<>(group_id IS NULL)));
CREATE INDEX IF NOT EXISTS messages_pair ON messages(pair_id,created,id);
CREATE INDEX IF NOT EXISTS messages_group ON messages(group_id,created,id);
CREATE INDEX IF NOT EXISTS messages_sender ON messages(sender_id,created);
CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,target_group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,target_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,reason TEXT NOT NULL CHECK(length(reason) BETWEEN 1 AND 1000),created INTEGER NOT NULL,resolved INTEGER NOT NULL DEFAULT 0 CHECK(resolved IN(0,1)));
CREATE INDEX IF NOT EXISTS reports_created ON reports(created,id);`;
const actor='(SELECT uid FROM actor)',cte='WITH actor AS(SELECT ? AS uid) ';
const adult=id=>`EXISTS(SELECT 1 FROM profiles WHERE user_id=${id} AND json_extract(data,'$.adult')=1)`;
const safe=id=>`NOT EXISTS(SELECT 1 FROM user_safety WHERE user_id=${id} AND suspended=1)`;
const clear=(a,b)=>`NOT EXISTS(SELECT 1 FROM user_blocks WHERE (blocker_id=${a} AND blocked_id=${b}) OR (blocker_id=${b} AND blocked_id=${a}))`;
const eligibleActor=`${adult(actor)} AND ${safe(actor)}`;
const pairAllowed=`SELECT p.id FROM pairings p WHERE (p.first_user=${actor} OR p.second_user=${actor}) AND p.first_decision='yes' AND p.second_decision='yes' AND ${adult('p.first_user')} AND ${adult('p.second_user')} AND ${safe('p.first_user')} AND ${safe('p.second_user')} AND ${clear('p.first_user','p.second_user')}`;
const groupAllowed=`SELECT g.id FROM groups g WHERE g.cancelled=0 AND ${eligibleActor} AND EXISTS(SELECT 1 FROM group_members WHERE group_id=g.id AND user_id=${actor}) AND NOT EXISTS(SELECT 1 FROM group_members gm WHERE gm.group_id=g.id AND NOT (${clear(actor,'gm.user_id')}))`;
const groupReportable=`SELECT g.id FROM groups g WHERE ${eligibleActor} AND ${adult('g.organizer_id')} AND ${safe('g.organizer_id')} AND ${clear(actor,'g.organizer_id')} AND NOT EXISTS(SELECT 1 FROM group_members gm WHERE gm.group_id=g.id AND NOT (${clear(actor,'gm.user_id')}))`;
const thread=(kind)=>kind==='pair'?{column:'pair_id',allowed:pairAllowed}:{column:'group_id',allowed:groupAllowed};
const messageAllowed=`((m.pair_id IN(${pairAllowed})) OR (m.group_id IN(${groupAllowed})))`;
const contact=`SELECT u.id FROM users u WHERE u.id<>${actor} AND (EXISTS(SELECT 1 FROM pairings p WHERE (p.first_user=${actor} AND p.second_user=u.id) OR (p.second_user=${actor} AND p.first_user=u.id)) OR EXISTS(SELECT 1 FROM group_members me JOIN group_members peer ON peer.group_id=me.group_id WHERE me.user_id=${actor} AND peer.user_id=u.id))`;
const reportTarget=target=>({column:{userId:'target_user_id',groupId:'target_group_id',messageId:'target_message_id'}[target],allowed:target==='userId'?contact:target==='groupId'?groupReportable:`SELECT m.id FROM messages m WHERE ${messageAllowed}`});
export function createCommunityStore({first,all}){
 return {
  isSuspended:async id=>Boolean(await first('SELECT user_id FROM user_safety WHERE user_id=? AND suspended=1',id)),
  setSuspended:(id,suspended)=>first('INSERT INTO user_safety(user_id,suspended) SELECT id,? FROM users WHERE id=? ON CONFLICT(user_id) DO UPDATE SET suspended=excluded.suspended RETURNING user_id',suspended?1:0,id),
  canChat:(uid,kind,id)=>{const t=thread(kind);return first(cte+`SELECT id FROM (${t.allowed}) WHERE id=?`,uid,id);},
  listMessages:(uid,kind,id)=>{const t=thread(kind);return all(cte+`SELECT recent.id,recent.sender_id,recent.body,recent.created,COALESCE(NULLIF(json_extract(pr.data,'$.name'),''),NULLIF(u.name,''),'Partecipante') AS sender_name FROM (SELECT m.* FROM messages m WHERE m.${t.column}=? AND m.${t.column} IN(${t.allowed}) ORDER BY created DESC,id DESC LIMIT 50) recent JOIN users u ON u.id=recent.sender_id LEFT JOIN profiles pr ON pr.user_id=recent.sender_id ORDER BY recent.created,recent.id`,uid,id);},
  sendMessage:(uid,kind,id,messageId,body)=>{const t=thread(kind),now=Date.now();return first(cte+`INSERT INTO messages(id,${t.column},sender_id,body,created) SELECT ?,?,?,?,? WHERE ? IN(${t.allowed}) AND ((EXISTS(SELECT 1 FROM messages WHERE id=? AND sender_id=${actor} AND ${t.column}=? AND body=?)) OR ((SELECT count(*) FROM messages)<5000 AND (SELECT count(*) FROM messages WHERE sender_id=${actor} AND created>?)<20)) ON CONFLICT(id) DO UPDATE SET id=messages.id WHERE messages.sender_id=excluded.sender_id AND messages.${t.column}=excluded.${t.column} AND messages.body=excluded.body RETURNING id,sender_id,body,created`,uid,messageId,id,uid,body,now,id,messageId,id,body,now-60000);},
  listBlocks:uid=>all('SELECT b.blocked_id AS userId,COALESCE(NULLIF(u.name,\'\'),\'Una persona\') AS name FROM user_blocks b JOIN users u ON u.id=b.blocked_id WHERE b.blocker_id=? ORDER BY b.created DESC LIMIT 50',uid),
  block:(uid,id)=>first(cte+`INSERT INTO user_blocks(blocker_id,blocked_id,created) SELECT ${actor},u.id,? FROM users u WHERE u.id=? AND u.id<>${actor} AND (${eligibleActor}) ON CONFLICT(blocker_id,blocked_id) DO UPDATE SET created=user_blocks.created RETURNING blocked_id`,uid,Date.now(),id),
  unblock:(uid,id)=>first('DELETE FROM user_blocks WHERE blocker_id=? AND blocked_id=? RETURNING blocked_id',uid,id),
  canReport:(uid,target,id)=>{const {allowed}=reportTarget(target);return first(cte+`SELECT id FROM (${allowed}) WHERE id=? AND (${eligibleActor})`,uid,id);},
  async report(uid,target,id,reason){
   const {column,allowed}=reportTarget(target),now=Date.now(),dayStart=Math.floor(now/86400000)*86400000;
   const duplicate=`SELECT r.id FROM reports r WHERE r.reporter_id=${actor} AND r.${column}=? AND r.reason=?`;
   const inserted=await first(cte+`INSERT INTO reports(id,reporter_id,${column},reason,created) SELECT ?,${actor},?,?,? WHERE (${eligibleActor}) AND ? IN(${allowed}) AND NOT EXISTS(${duplicate}) AND (SELECT count(*) FROM reports)<5000 AND (SELECT count(*) FROM reports WHERE reporter_id=${actor} AND created>=?)<5 RETURNING id`,uid,crypto.randomUUID(),id,reason,now,id,id,reason,dayStart);
   return inserted||first(cte+`${duplicate} AND (${eligibleActor}) AND ? IN(${allowed}) ORDER BY r.created,r.id LIMIT 1`,uid,id,reason,id);
  },
  resolveReport:(id,resolved)=>first('UPDATE reports SET resolved=? WHERE id=? RETURNING id',resolved?1:0,id),
  listReports:()=>all('SELECT r.id,r.reporter_id AS reporterId,r.target_user_id AS userId,r.target_group_id AS groupId,r.target_message_id AS messageId,r.reason,r.created,r.resolved,m.sender_id AS messageSenderId,m.body AS messageBody,g.organizer_id AS groupOrganizerId,g.title AS groupTitle,g.description AS groupDescription FROM reports r LEFT JOIN messages m ON m.id=r.target_message_id LEFT JOIN groups g ON g.id=r.target_group_id WHERE r.resolved=0 ORDER BY r.created ASC,r.id LIMIT 50')
 };
}
