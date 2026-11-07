// Attempts deliberately have no account/device FK: removing consent cannot reset quotas.
import {NOTIFICATION_VISIBLE_SQL} from './notifications-store.mjs';
export const PUSH_SCHEMA=`
CREATE TABLE IF NOT EXISTS push_devices(installation_id TEXT PRIMARY KEY,proof_hash TEXT NOT NULL,device_key TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,session_hash TEXT NOT NULL REFERENCES sessions(hash) ON DELETE CASCADE,token_cipher TEXT NOT NULL,token_hash TEXT NOT NULL UNIQUE,project_id TEXT NOT NULL,version TEXT NOT NULL,cursor INTEGER NOT NULL,created INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS push_devices_user ON push_devices(user_id);
CREATE TABLE IF NOT EXISTS push_attempts(id TEXT PRIMARY KEY,device_key TEXT NOT NULL,version TEXT NOT NULL,notification_id INTEGER NOT NULL,day TEXT NOT NULL,created INTEGER NOT NULL,state TEXT NOT NULL CHECK(state IN('reserved','ticket','checking','receipt_ok','failed','expired')),ticket_id TEXT,receipt_after INTEGER,UNIQUE(version,notification_id));
CREATE INDEX IF NOT EXISTS push_attempts_day ON push_attempts(day,device_key);
CREATE INDEX IF NOT EXISTS push_attempts_receipts ON push_attempts(state,receipt_after);
CREATE TRIGGER IF NOT EXISTS push_attempt_cursor AFTER INSERT ON push_attempts BEGIN UPDATE push_devices SET cursor=MAX(cursor,NEW.notification_id) WHERE version=NEW.version; END;
`;
const eligible=alias=>`EXISTS(SELECT 1 FROM profiles p WHERE p.user_id=${alias}.user_id AND json_type(p.data,'$.adult')='true') AND NOT EXISTS(SELECT 1 FROM user_safety s WHERE s.user_id=${alias}.user_id AND s.suspended=1)`;
const active=`EXISTS(SELECT 1 FROM sessions s WHERE s.hash=d.session_hash AND s.user_id=d.user_id AND s.expires>?) AND ${eligible('d')}`;
export function createPushStore({first,all}){
 return {
  async register(d,now=Date.now()){
   // A single SQLite statement serializes ownership, session checks, and account caps.
   try{return await first(`INSERT INTO push_devices(installation_id,proof_hash,device_key,user_id,session_hash,token_cipher,token_hash,project_id,version,cursor,created)
    SELECT ?,?,?,?,?,?,?,?,?,COALESCE((SELECT MAX(id) FROM notifications WHERE user_id=?),0),?
    WHERE EXISTS(SELECT 1 FROM sessions s WHERE s.hash=? AND s.user_id=? AND s.expires>? AND ${eligible('s')})
    AND NOT EXISTS(SELECT 1 FROM push_devices WHERE installation_id=? AND proof_hash<>?)
    AND ((SELECT count(*) FROM push_devices WHERE user_id=?)<5 OR EXISTS(SELECT 1 FROM push_devices WHERE installation_id=? AND user_id=?))
    ON CONFLICT(installation_id) DO UPDATE SET user_id=excluded.user_id,session_hash=excluded.session_hash,token_cipher=excluded.token_cipher,token_hash=excluded.token_hash,project_id=excluded.project_id,version=excluded.version,cursor=MAX(push_devices.cursor,excluded.cursor),created=excluded.created
    WHERE push_devices.proof_hash=excluded.proof_hash RETURNING installation_id`,d.installationId,d.proofHash,d.deviceKey,d.userId,d.sessionHash,d.tokenCipher,d.tokenHash,d.projectId,d.version,d.userId,now,d.sessionHash,d.userId,now,d.installationId,d.proofHash,d.userId,d.installationId,d.userId);}catch(error){if(/UNIQUE constraint failed: push_devices.token_hash/.test(String(error?.message)))return null;throw error;}
  },
  status:(userId,sessionHash,now=Date.now())=>first(`SELECT 1 AS enabled FROM push_devices d WHERE d.user_id=? AND d.session_hash=? AND ${active} LIMIT 1`,userId,sessionHash,now),
  disable:(installationId,proofHash)=>first('DELETE FROM push_devices WHERE installation_id=? AND proof_hash=? RETURNING installation_id',installationId,proofHash),
  candidates:now=>all(`SELECT d.* FROM push_devices d WHERE ${active} AND EXISTS(WITH actor AS(SELECT d.user_id AS uid) SELECT 1 FROM notifications n WHERE ${NOTIFICATION_VISIBLE_SQL} AND n.read=0 AND n.id>d.cursor) AND NOT EXISTS(SELECT 1 FROM push_attempts a WHERE a.device_key=d.device_key AND (a.state IN('reserved','ticket','checking') OR a.created>?)) ORDER BY (SELECT MAX(n.id) FROM notifications n WHERE n.user_id=d.user_id AND n.read=0) DESC,d.installation_id LIMIT 50`,now,now-300000),
  current:(version,now)=>first(`SELECT d.* FROM push_devices d WHERE d.version=? AND ${active}`,version,now),
  reserve:(d,notificationId,now)=>first(`INSERT INTO push_attempts(id,device_key,version,notification_id,day,created,state)
   SELECT ?,d.device_key,d.version,?,?,?,'reserved' FROM push_devices d
   WHERE d.installation_id=? AND d.version=? AND d.cursor<? AND ${active}
   AND EXISTS(SELECT 1 FROM notifications WHERE id=? AND user_id=d.user_id AND read=0)
   AND (SELECT count(*) FROM push_attempts WHERE day=?)<100
   AND (SELECT count(*) FROM push_attempts WHERE day=? AND device_key=d.device_key)<20
   AND NOT EXISTS(SELECT 1 FROM push_attempts WHERE device_key=d.device_key AND (created>? OR state IN('reserved','ticket','checking')))
   ON CONFLICT DO NOTHING RETURNING *`,crypto.randomUUID(),notificationId,new Date(now).toISOString().slice(0,10),now,d.installation_id,d.version,notificationId,now,notificationId,new Date(now).toISOString().slice(0,10),new Date(now).toISOString().slice(0,10),now-300000),
  finish:(id,state,ticketId=null,now=Date.now())=>first("UPDATE push_attempts SET state=?,ticket_id=?,receipt_after=? WHERE id=? AND state='reserved' RETURNING id",state,ticketId,ticketId?now+900000:null,id),
  revokeVersion:version=>first('DELETE FROM push_devices WHERE version=? RETURNING installation_id',version),
  receipts:now=>all("UPDATE push_attempts SET state='checking',receipt_after=? WHERE id IN(SELECT id FROM push_attempts WHERE ((state='ticket' AND receipt_after<=?) OR (state='checking' AND receipt_after<=?)) AND created>? ORDER BY created LIMIT 5) RETURNING *",now+900000,now,now,now-86400000),
  receiptResult:(id,state,now)=>first("UPDATE push_attempts SET state=?,receipt_after=? WHERE id=? AND state='checking' RETURNING id",state,now+900000,id),
  async prune(now){await all('DELETE FROM push_attempts WHERE created<? RETURNING id',now-7*86400000);await all("UPDATE push_attempts SET state='expired' WHERE state IN('reserved','ticket','checking') AND created<=? RETURNING id",now-86400000);}
 };
}
