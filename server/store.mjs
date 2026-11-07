import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import {createMeetingsStore,MEETINGS_SCHEMA} from './meetings-store.mjs';
import {createCommunityStore,COMMUNITY_SCHEMA} from './community-store.mjs';
import {createGroupsStore,GROUPS_SCHEMA} from './groups-store.mjs';
import {createMatchingStore,MATCHING_SCHEMA} from './matching-store.mjs';
import {SHARED_IMAGE_FROM,SHARED_IMAGE_WHERE} from './peer-images-store.mjs';
import {createNotificationsStore,NOTIFICATIONS_SCHEMA} from './notifications-store.mjs';

export function createStore(path) {
 const db=new DatabaseSync(path);
 db.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, provider TEXT NOT NULL, subject TEXT NOT NULL, email TEXT NOT NULL, name TEXT NOT NULL, UNIQUE(provider,subject));
 CREATE TABLE IF NOT EXISTS profiles(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS illustrated_profiles(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, data TEXT NOT NULL, version INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS image_attempts(id TEXT PRIMARY KEY, account_id TEXT NOT NULL, user_id TEXT REFERENCES users(id) ON DELETE SET NULL, slot TEXT NOT NULL, day TEXT NOT NULL, created INTEGER NOT NULL, state TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS image_attempts_day ON image_attempts(account_id,day);
 CREATE TABLE IF NOT EXISTS profile_images(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, slot TEXT NOT NULL, description_hash TEXT NOT NULL, data BLOB NOT NULL, mime TEXT NOT NULL, model TEXT NOT NULL, style_version TEXT NOT NULL, approved INTEGER NOT NULL, created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS attempts(hash TEXT PRIMARY KEY, data TEXT NOT NULL, expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS handoffs(hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, challenge TEXT NOT NULL, expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS apple_account_state(subject TEXT PRIMARY KEY, revoked_at INTEGER NOT NULL DEFAULT 0, email_event_time INTEGER NOT NULL DEFAULT 0, email_enabled INTEGER);
 CREATE TABLE IF NOT EXISTS apple_notifications(id TEXT PRIMARY KEY, expires INTEGER NOT NULL, processed INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS apple_session_grants(hash TEXT PRIMARY KEY REFERENCES sessions(hash) ON DELETE CASCADE, issued_at INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS apple_notifications_expiry ON apple_notifications(expires);`);
 db.exec(MEETINGS_SCHEMA);
 db.exec(COMMUNITY_SCHEMA);db.exec(GROUPS_SCHEMA);db.exec(MATCHING_SCHEMA);
 if(!db.prepare('PRAGMA table_info(reports)').all().some(column=>column.name==='resolved'))db.exec('ALTER TABLE reports ADD COLUMN resolved INTEGER NOT NULL DEFAULT 0');
 db.exec(NOTIFICATIONS_SCHEMA);
 const queries={first:(sql,...args)=>db.prepare(sql).get(...args)??null,all:(sql,...args)=>db.prepare(sql).all(...args)};
 const meetings=createMeetingsStore(queries),community=createCommunityStore(queries),groups=createGroupsStore(queries),matching=createMatchingStore(queries),notifications=createNotificationsStore(queries);
 function prune() { const now=Date.now(); for(const table of ['attempts','sessions','handoffs']) db.prepare(`DELETE FROM ${table} WHERE expires < ?`).run(now); }
 function imageUsage(accountId,userId=null,now=Date.now()){
  const day=new Date(now).toISOString().slice(0,10);
  return {global:db.prepare('SELECT count(*) AS n FROM image_attempts WHERE account_id=? AND day=?').get(accountId,day).n,
   user:userId?db.prepare('SELECT count(*) AS n FROM image_attempts WHERE account_id=? AND day=? AND user_id=?').get(accountId,day,userId).n:0};
 }
 return {
  imageUsage,meetings,community,groups,matching,notifications,
  getSharedProfileImage(actor,pairId,slot){return db.prepare(`SELECT i.* ${SHARED_IMAGE_FROM} WHERE ${SHARED_IMAGE_WHERE} ORDER BY i.created DESC,i.id LIMIT 1`).get(pairId,actor,actor,actor,slot)??null;},
  reserveImageAttempt(accountId,userId,slot){
   const now=Date.now(),day=new Date(now).toISOString().slice(0,10);db.exec('BEGIN IMMEDIATE');
   try{
    const usage=imageUsage(accountId,userId,now);
    const busy=db.prepare("SELECT id FROM image_attempts WHERE user_id=? AND state='pending' AND created>?").get(userId,now-120000);
    if(usage.global>=50||usage.user>=12){db.exec('COMMIT');return {error:'quota'};}
    if(busy){db.exec('COMMIT');return {error:'busy'};}
    const id=randomUUID();db.prepare('INSERT INTO image_attempts VALUES(?,?,?,?,?,?,?)').run(id,accountId,userId,slot,day,now,'pending');db.exec('COMMIT');return {id};
   }catch(error){db.exec('ROLLBACK');throw error;}
  },
  finishImageAttempt(id,success){db.prepare('UPDATE image_attempts SET state=? WHERE id=?').run(success?'done':'failed',id);},
  saveProfileImage(userId,slot,descriptionHash,image,id,expectedVersion){
   db.exec('BEGIN IMMEDIATE');try{
    if(expectedVersion!==undefined&&db.prepare('SELECT version FROM illustrated_profiles WHERE user_id=?').get(userId)?.version!==expectedVersion)throw Object.assign(new Error('Bozza aggiornata durante la generazione.'),{status:409});
    db.prepare('DELETE FROM profile_images WHERE user_id=? AND slot=? AND approved=0').run(userId,slot);
    db.prepare('INSERT INTO profile_images VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,userId,slot,descriptionHash,image.bytes,image.mime,image.model,image.styleVersion,0,Date.now());
    db.exec('COMMIT');
   }catch(error){db.exec('ROLLBACK');throw error;}
  },
  getProfileImages(userId,slot){return db.prepare('SELECT * FROM profile_images WHERE user_id=? AND slot=? ORDER BY approved ASC,created DESC').all(userId,slot);},
  approveProfileImage(userId,slot,id,expectedVersion){
   db.exec('BEGIN IMMEDIATE');try{
    if(expectedVersion!==undefined&&db.prepare('SELECT version FROM illustrated_profiles WHERE user_id=?').get(userId)?.version!==expectedVersion){db.exec('COMMIT');return false;}
    const result=db.prepare('UPDATE profile_images SET approved=1 WHERE user_id=? AND slot=? AND id=?').run(userId,slot,id);
    if(result.changes)db.prepare('DELETE FROM profile_images WHERE user_id=? AND slot=? AND id<>?').run(userId,slot,id);
    db.exec('COMMIT');return Boolean(result.changes);
   }catch(error){db.exec('ROLLBACK');throw error;}
  },
  discardProfileImage(userId,slot,id){return Boolean(db.prepare('DELETE FROM profile_images WHERE user_id=? AND slot=? AND id=? AND approved=0').run(userId,slot,id).changes);},
  close:()=>db.close(),
  getIdentity:id=>db.prepare('SELECT * FROM users WHERE id=?').get(id),
  putAppleIdentitySession(identity,hash,issuedAt){
   db.exec('BEGIN IMMEDIATE');try{
    if(db.prepare('SELECT subject FROM apple_account_state WHERE subject=? AND revoked_at>=?').get(identity.subject,issuedAt*1000)){db.exec('COMMIT');return false;}
    let user=db.prepare("SELECT id FROM users WHERE provider='apple' AND subject=?").get(identity.subject);
    if(!user){user={id:randomUUID()};db.prepare("INSERT INTO users VALUES(?,'apple',?,?,'')").run(user.id,identity.subject,identity.email);}
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,user.id,Date.now()+604800000);
    db.prepare('INSERT INTO apple_session_grants VALUES(?,?)').run(hash,issuedAt*1000);db.exec('COMMIT');return true;
   }catch(error){db.exec('ROLLBACK');throw error;}
  },
  revokeAndDeleteAppleAccount(userId,revokedAt){
   db.exec('BEGIN IMMEDIATE');try{
    db.prepare("INSERT INTO apple_account_state(subject,revoked_at) SELECT subject,? FROM users WHERE id=? AND provider='apple' ON CONFLICT(subject) DO UPDATE SET revoked_at=MAX(revoked_at,excluded.revoked_at)").run(revokedAt,userId);
    db.prepare("DELETE FROM users WHERE id=? AND provider='apple'").run(userId);db.exec('COMMIT');
   }catch(error){db.exec('ROLLBACK');throw error;}
  },
  putAppleSession(hash,userId,issuedAt){
   db.exec('BEGIN IMMEDIATE');try{
    const changed=Boolean(db.prepare("INSERT INTO sessions SELECT ?,id,? FROM users WHERE id=? AND provider='apple' AND NOT EXISTS(SELECT 1 FROM apple_account_state WHERE subject=users.subject AND revoked_at>=?)").run(hash,Date.now()+604800000,userId,issuedAt*1000).changes);
    if(changed)db.prepare('INSERT INTO apple_session_grants VALUES(?,?)').run(hash,issuedAt*1000);db.exec('COMMIT');return changed;
   }catch(error){db.exec('ROLLBACK');throw error;}
  },
  applyAppleEvent(event){
   db.exec('BEGIN IMMEDIATE');try{
    db.prepare('DELETE FROM apple_notifications WHERE expires<?').run(Date.now());
    if(!db.prepare('INSERT INTO apple_notifications VALUES(?,?,1) ON CONFLICT(id) DO NOTHING').run(event.id,event.expires).changes){db.exec('COMMIT');return false;}
    if(event.type==='email-enabled'||event.type==='email-disabled'){
     db.prepare('INSERT INTO apple_account_state(subject,email_event_time,email_enabled) VALUES(?,?,?) ON CONFLICT(subject) DO UPDATE SET email_event_time=excluded.email_event_time,email_enabled=excluded.email_enabled WHERE excluded.email_event_time>apple_account_state.email_event_time').run(event.subject,event.eventTime,event.type==='email-enabled'?1:0);
    }else{
     db.prepare('INSERT INTO apple_account_state(subject,revoked_at) VALUES(?,?) ON CONFLICT(subject) DO UPDATE SET revoked_at=MAX(revoked_at,excluded.revoked_at)').run(event.subject,event.eventTime);
     db.prepare("DELETE FROM sessions WHERE user_id IN(SELECT id FROM users WHERE provider='apple' AND subject=?) AND NOT EXISTS(SELECT 1 FROM apple_session_grants WHERE hash=sessions.hash AND issued_at>?)").run(event.subject,event.eventTime);
     db.prepare("DELETE FROM handoffs WHERE user_id IN(SELECT id FROM users WHERE provider='apple' AND subject=?)").run(event.subject);
     if(event.type==='account-deleted')db.prepare("DELETE FROM users WHERE provider='apple' AND subject=?").run(event.subject);
    }
    db.exec('COMMIT');return true;
   }catch(error){db.exec('ROLLBACK');throw error;}
  },
  upsertIdentity(provider,subject,email,name) {
   const existing=db.prepare('SELECT * FROM users WHERE provider=? AND subject=?').get(provider,subject);
   if(existing) return existing;
   const id=randomUUID(); db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(id,provider,subject,email,name);
   return {id,provider,subject,email,name};
  },
  putAttempt(hash,data) { prune(); db.prepare('INSERT INTO attempts VALUES(?,?,?)').run(hash,JSON.stringify(data),Date.now()+600_000); },
  takeAttempt(hash) { const row=db.prepare('DELETE FROM attempts WHERE hash=? RETURNING *').get(hash); return row&&row.expires>Date.now()?JSON.parse(row.data):null; },
  putSession(hash,userId) { prune(); db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,userId,Date.now()+604_800_000); },
  getSession(hash) { return db.prepare('SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>?').get(hash,Date.now()); },
  dropSession(hash) { db.prepare('DELETE FROM sessions WHERE hash=?').run(hash); },
  putHandoff(hash,userId,challenge) { prune(); db.prepare('INSERT INTO handoffs VALUES(?,?,?,?)').run(hash,userId,challenge,Date.now()+60_000); },
  takeHandoff(hash) { const row=db.prepare('DELETE FROM handoffs WHERE hash=? RETURNING *').get(hash); return row&&row.expires>Date.now()?row:null; },
  getProfile(id) { const row=db.prepare('SELECT data FROM profiles WHERE user_id=?').get(id); return row?JSON.parse(row.data):null; },
  saveProfile(id,profile) { db.prepare('INSERT INTO profiles VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data').run(id,JSON.stringify(profile)); },
  getIllustratedProfile(id) {
   const row=db.prepare('SELECT data,version FROM illustrated_profiles WHERE user_id=?').get(id);
   return row?{draft:JSON.parse(row.data),version:row.version}:{draft:null,version:0};
  },
  saveIllustratedProfile(id,draft,expectedVersion) {
   const row=expectedVersion===0
    ?db.prepare('INSERT INTO illustrated_profiles VALUES(?,?,1) ON CONFLICT(user_id) DO NOTHING RETURNING version').get(id,JSON.stringify(draft))
    :db.prepare('UPDATE illustrated_profiles SET data=?,version=version+1 WHERE user_id=? AND version=? RETURNING version').get(JSON.stringify(draft),id,expectedVersion);
   return row?{draft,version:row.version}:null;
  },
  deleteAccount(id) { db.prepare('DELETE FROM users WHERE id=?').run(id); },
 };
}
