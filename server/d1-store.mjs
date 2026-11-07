import {randomUUID} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {createMeetingsStore} from './meetings-store.mjs';
export function createD1Store(db){
 const stmt=(sql,...args)=>db.prepare(sql).bind(...args);
 const run=(sql,...args)=>stmt(sql,...args).run();
 const first=(sql,...args)=>stmt(sql,...args).first();
 const all=async(sql,...args)=>(await stmt(sql,...args).all()).results;
 async function ttl(table,hash,data,expires){
  const now=Date.now();await db.batch([...['attempts','sessions','handoffs'].map(t=>stmt(`DELETE FROM ${t} WHERE expires<?`,now)),stmt(`INSERT INTO ${table} VALUES(${data.map(()=>'?').join(',')})`,...data)]);
 }
 async function imageUsage(accountId,userId=null,now=Date.now()){
  const day=new Date(now).toISOString().slice(0,10);return {global:(await first('SELECT count(*) AS n FROM image_attempts WHERE account_id=? AND day=?',accountId,day)).n,user:userId?(await first('SELECT count(*) AS n FROM image_attempts WHERE account_id=? AND day=? AND user_id=?',accountId,day,userId)).n:0};
 }
 return {
  close(){},imageUsage,meetings:createMeetingsStore({first,all}),
  getIdentity:id=>first('SELECT * FROM users WHERE id=?',id),
  async putAppleIdentitySession(identity,hash,issuedAt){
   const guard='NOT EXISTS(SELECT 1 FROM apple_account_state WHERE subject=? AND revoked_at>=?)',results=await db.batch([
    stmt(`INSERT INTO users SELECT ?,'apple',?,? ,'' WHERE ${guard} ON CONFLICT(provider,subject) DO NOTHING`,randomUUID(),identity.subject,identity.email,identity.subject,issuedAt*1000),
    stmt(`INSERT INTO sessions SELECT ?,id,? FROM users WHERE provider='apple' AND subject=? AND ${guard}`,hash,Date.now()+604800000,identity.subject,identity.subject,issuedAt*1000),
    stmt('INSERT INTO apple_session_grants SELECT hash,? FROM sessions WHERE hash=?',issuedAt*1000,hash)
   ]);return Boolean(results[1].meta.changes);
  },
  revokeAndDeleteAppleAccount(userId,revokedAt){return db.batch([stmt("INSERT INTO apple_account_state(subject,revoked_at) SELECT subject,? FROM users WHERE id=? AND provider='apple' ON CONFLICT(subject) DO UPDATE SET revoked_at=MAX(revoked_at,excluded.revoked_at)",revokedAt,userId),stmt("DELETE FROM users WHERE id=? AND provider='apple'",userId)]);},
  async putAppleSession(hash,userId,issuedAt){const results=await db.batch([stmt("INSERT INTO sessions SELECT ?,id,? FROM users WHERE id=? AND provider='apple' AND NOT EXISTS(SELECT 1 FROM apple_account_state WHERE subject=users.subject AND revoked_at>=?)",hash,Date.now()+604800000,userId,issuedAt*1000),stmt('INSERT INTO apple_session_grants SELECT hash,? FROM sessions WHERE hash=?',issuedAt*1000,hash)]);return Boolean(results[0].meta.changes);},
  async applyAppleEvent(event){
   const pending='EXISTS(SELECT 1 FROM apple_notifications WHERE id=? AND processed=0)',jobs=[stmt('DELETE FROM apple_notifications WHERE expires<?',Date.now()),stmt('INSERT INTO apple_notifications VALUES(?,?,0) ON CONFLICT(id) DO NOTHING',event.id,event.expires)];
   if(event.type==='email-enabled'||event.type==='email-disabled'){
    jobs.push(stmt(`INSERT INTO apple_account_state(subject,email_event_time,email_enabled) SELECT ?,?,? WHERE ${pending} ON CONFLICT(subject) DO UPDATE SET email_event_time=excluded.email_event_time,email_enabled=excluded.email_enabled WHERE excluded.email_event_time>apple_account_state.email_event_time`,event.subject,event.eventTime,event.type==='email-enabled'?1:0,event.id));
   }else{
    jobs.push(stmt(`INSERT INTO apple_account_state(subject,revoked_at) SELECT ?,? WHERE ${pending} ON CONFLICT(subject) DO UPDATE SET revoked_at=MAX(revoked_at,excluded.revoked_at)`,event.subject,event.eventTime,event.id));
    jobs.push(stmt(`DELETE FROM sessions WHERE user_id IN(SELECT id FROM users WHERE provider='apple' AND subject=?) AND NOT EXISTS(SELECT 1 FROM apple_session_grants WHERE hash=sessions.hash AND issued_at>?) AND ${pending}`,event.subject,event.eventTime,event.id));
    jobs.push(stmt(`DELETE FROM handoffs WHERE user_id IN(SELECT id FROM users WHERE provider='apple' AND subject=?) AND ${pending}`,event.subject,event.id));
    if(event.type==='account-deleted')jobs.push(stmt(`DELETE FROM users WHERE provider='apple' AND subject=? AND ${pending}`,event.subject,event.id));
   }
   jobs.push(stmt('UPDATE apple_notifications SET processed=1 WHERE id=? AND processed=0',event.id));
   const results=await db.batch(jobs);return Boolean(results.at(-1).meta.changes);
  },
  async upsertIdentity(provider,subject,email,name){
   const row=await first('INSERT INTO users VALUES(?,?,?,?,?) ON CONFLICT(provider,subject) DO NOTHING RETURNING *',randomUUID(),provider,subject,email,name);
   return row||first('SELECT * FROM users WHERE provider=? AND subject=?',provider,subject);
  },
  putAttempt:(hash,data)=>ttl('attempts',hash,[hash,JSON.stringify(data),Date.now()+600000]),
  async takeAttempt(hash){const row=await first('DELETE FROM attempts WHERE hash=? RETURNING *',hash);return row&&row.expires>Date.now()?JSON.parse(row.data):null;},
  putSession:(hash,userId)=>ttl('sessions',hash,[hash,userId,Date.now()+604800000]),
  getSession:hash=>first('SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>?',hash,Date.now()),
  dropSession:hash=>run('DELETE FROM sessions WHERE hash=?',hash),
  putHandoff:(hash,userId,challenge)=>ttl('handoffs',hash,[hash,userId,challenge,Date.now()+60000]),
  async takeHandoff(hash){const row=await first('DELETE FROM handoffs WHERE hash=? RETURNING *',hash);return row&&row.expires>Date.now()?row:null;},
  async getProfile(id){const row=await first('SELECT data FROM profiles WHERE user_id=?',id);return row?JSON.parse(row.data):null;},
  saveProfile:(id,profile)=>run('INSERT INTO profiles VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data',id,JSON.stringify(profile)),
  async getIllustratedProfile(id){const row=await first('SELECT data,version FROM illustrated_profiles WHERE user_id=?',id);return row?{draft:JSON.parse(row.data),version:row.version}:{draft:null,version:0};},
  async saveIllustratedProfile(id,draft,version){const row=version===0?await first('INSERT INTO illustrated_profiles VALUES(?,?,1) ON CONFLICT(user_id) DO NOTHING RETURNING version',id,JSON.stringify(draft)):await first('UPDATE illustrated_profiles SET data=?,version=version+1 WHERE user_id=? AND version=? RETURNING version',JSON.stringify(draft),id,version);return row?{draft,version:row.version}:null;},
  deleteAccount:id=>run('DELETE FROM users WHERE id=?',id),
  async reserveImageAttempt(accountId,userId,slot){
   const now=Date.now(),day=new Date(now).toISOString().slice(0,10),id=randomUUID();
   const row=await first(`INSERT INTO image_attempts SELECT ?,?,?,?,?,?,'pending'
    WHERE (SELECT count(*) FROM image_attempts WHERE account_id=? AND day=?)<50
    AND (SELECT count(*) FROM image_attempts WHERE account_id=? AND day=? AND user_id=?)<12
    AND NOT EXISTS(SELECT 1 FROM image_attempts WHERE user_id=? AND state='pending' AND created>?) RETURNING id`,id,accountId,userId,slot,day,now,accountId,day,accountId,day,userId,userId,now-120000);
   if(row)return row;const usage=await imageUsage(accountId,userId,now);return {error:usage.global>=50||usage.user>=12?'quota':'busy'};
  },
  finishImageAttempt:(id,success)=>run('UPDATE image_attempts SET state=? WHERE id=?',success?'done':'failed',id),
  async saveProfileImage(userId,slot,descriptionHash,image,id,expectedVersion){
   const bytes=Buffer.from(image.bytes);if(!bytes.length||bytes.length>8000000)throw new Error('Image too large');
   const statements=[stmt('DELETE FROM profile_images WHERE user_id=? AND slot=? AND approved=0',userId,slot),stmt('INSERT INTO profile_images SELECT ?,?,?,?,?,?,?,?,? WHERE (? IS NULL OR EXISTS(SELECT 1 FROM illustrated_profiles WHERE user_id=? AND version=?))',id,userId,slot,descriptionHash,image.mime,image.model,image.styleVersion,0,Date.now(),expectedVersion??null,userId,expectedVersion??null)];
   for(let offset=0,part=0;offset<bytes.length;offset+=512000,part++)statements.push(stmt('INSERT INTO profile_image_chunks VALUES(?,?,?)',id,part,Uint8Array.from(bytes.subarray(offset,offset+512000)).buffer));
   try{await db.batch(statements);}catch(error){if(expectedVersion!==undefined&&(await first('SELECT version FROM illustrated_profiles WHERE user_id=?',userId))?.version!==expectedVersion)throw Object.assign(new Error('Bozza aggiornata durante la generazione.'),{status:409});throw error;}
  },
  async getProfileImages(userId,slot){
   const parts=await all('SELECT i.*,c.part,c.data AS chunk FROM profile_images i JOIN profile_image_chunks c ON c.image_id=i.id WHERE i.user_id=? AND i.slot=? ORDER BY i.approved ASC,i.created DESC,c.part',userId,slot);
   const rows=new Map();for(const part of parts){let row=rows.get(part.id);if(!row){const {chunk,part:ignored,...metadata}=part;row={...metadata,chunks:[]};rows.set(part.id,row);}row.chunks.push(Buffer.from(part.chunk));}
   return [...rows.values()].map(({chunks,...row})=>({...row,data:Buffer.concat(chunks)}));
  },
  async approveProfileImage(userId,slot,id,expectedVersion){
   const results=await db.batch([stmt('UPDATE profile_images SET approved=1 WHERE user_id=? AND slot=? AND id=? AND (? IS NULL OR EXISTS(SELECT 1 FROM illustrated_profiles WHERE user_id=? AND version=?))',userId,slot,id,expectedVersion??null,userId,expectedVersion??null),stmt('DELETE FROM profile_images WHERE user_id=? AND slot=? AND id<>? AND EXISTS(SELECT 1 FROM profile_images WHERE user_id=? AND slot=? AND id=? AND approved=1) AND (? IS NULL OR EXISTS(SELECT 1 FROM illustrated_profiles WHERE user_id=? AND version=?))',userId,slot,id,userId,slot,id,expectedVersion??null,userId,expectedVersion??null)]);return Boolean(results[0].meta.changes);
  },
  async discardProfileImage(userId,slot,id){return Boolean((await run('DELETE FROM profile_images WHERE user_id=? AND slot=? AND id=? AND approved=0',userId,slot,id)).meta.changes);},
 };
}
