import {applyLocalMigrations} from './support/d1-migrations.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';import {createD1Store} from '../server/d1-store.mjs';import {createApp} from '../server/auth.mjs';import {createHash} from 'node:crypto';
async function harness(){const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("test")}}',d1Databases:{DB:'test'}}));const db=await mf.getD1Database('DB');await applyLocalMigrations(db);return {mf,db,store:createD1Store(db)};}
test('D1 drives authenticated API and versioned profile writes',async()=>{
 const {mf,store}=await harness();try{const user=await store.upsertIdentity('google','a','a@example.com','Ada'),token='a'.repeat(43);await store.putSession(createHash('sha256').update(token).digest('base64url'),user.id);const app=createApp({store,config:{origin:'https://balotta.example'}}),headers={authorization:'Bearer '+token};assert.equal((await (await app(new Request('https://balotta.example/api/session',{headers}))).json()).user.id,user.id);
 assert.equal((await store.saveIllustratedProfile(user.id,{fields:{},confirmed:{}},0)).version,1);assert.equal(await store.saveIllustratedProfile(user.id,{},0),null);
 const writes=await Promise.all([store.saveIllustratedProfile(user.id,{x:1},1),store.saveIllustratedProfile(user.id,{x:2},1)]);assert.equal(writes.filter(Boolean).length,1);
 await store.putAttempt('a',{test:true});const attempts=await Promise.all([store.takeAttempt('a'),store.takeAttempt('a')]);assert.equal(attempts.filter(Boolean).length,1);
 await store.putHandoff('h',user.id,'challenge');assert.ok(await store.takeHandoff('h'));assert.equal(await store.takeHandoff('h'),null);
 }finally{await mf.dispose();}
});
test('D1 Apple notifications apply once atomically and block stale native sessions',async()=>{
 const {mf,store,db}=await harness();try{
  const apple=await store.upsertIdentity('apple','owner','owner@example.com',''),other=await store.upsertIdentity('google','owner','owner@example.com','Other'),now=Date.now(),event={id:'revoked',subject:'owner',type:'consent-revoked',eventTime:now,expires:now+691200000};
  await store.putSession('old',apple.id);await store.putSession('other',other.id);await store.putHandoff('handoff',apple.id,'challenge');
  const changes=await Promise.all([store.applyAppleEvent(event),store.applyAppleEvent(event)]);assert.equal(changes.filter(Boolean).length,1);assert.equal(await store.getSession('old'),null);assert.ok(await store.getSession('other'));assert.equal(await store.takeHandoff('handoff'),null);assert.equal(await store.putAppleSession('stale',apple.id,Math.floor(now/1000)-1),false);
  assert.equal(await store.putAppleSession('new',apple.id,Math.floor(now/1000)+1),true);assert.equal(await store.applyAppleEvent(event),false);assert.ok(await store.getSession('new'));
  await store.applyAppleEvent({...event,id:'mail',type:'email-disabled'});assert.equal((await db.prepare('SELECT email_enabled FROM apple_account_state WHERE subject=?').bind('owner').first()).email_enabled,0);assert.ok(await store.getSession('new'));
  await store.applyAppleEvent({...event,id:'delete',type:'account-deleted'});assert.equal(await store.getIdentity(apple.id),null);assert.ok(await store.getIdentity(other.id));
 }finally{await mf.dispose();}
});
test('D1 Apple deletion tombstone atomically prevents stale identity and session resurrection',async()=>{
 const {mf,store,db}=await harness();try{
  const u=await store.upsertIdentity('apple','deleted','old@example.com',''),now=Date.now();await store.revokeAndDeleteAppleAccount(u.id,now);
  assert.equal(await store.putAppleIdentitySession({subject:'deleted',email:'old@example.com'},'stale',Math.floor(now/1000)-1),false);assert.equal((await db.prepare("SELECT count(*) AS n FROM users WHERE provider='apple' AND subject='deleted'").first()).n,0);
  assert.equal(await store.putAppleIdentitySession({subject:'deleted',email:'new@example.com'},'fresh',Math.floor(now/1000)+1),true);assert.equal((await store.getSession('fresh')).email,'new@example.com');
 }finally{await mf.dispose();}
});
test('D1 delayed Apple revocations preserve sessions authorized after the event',async()=>{
 const {mf,store}=await harness();try{
  const u=await store.upsertIdentity('apple','delayed','a@example.com',''),now=Math.floor(Date.now()/1000),event={id:'late',subject:'delayed',type:'consent-revoked',eventTime:(now-20)*1000,expires:Date.now()+691200000};assert.equal(await store.putAppleSession('fresh',u.id,now-10),true);
  await store.applyAppleEvent(event);assert.ok(await store.getSession('fresh'));await store.applyAppleEvent({...event,id:'older',eventTime:(now-30)*1000});assert.ok(await store.getSession('fresh'));
 }finally{await mf.dispose();}
});
test('D1 appointments combine concurrent confirmations and reject conflicting revisions',async()=>{
 const {mf,store}=await harness();try{
  const a=await store.upsertIdentity('google','meeting-a','a@example.com','A'),b=await store.upsertIdentity('google','meeting-b','b@example.com','B'),c=await store.upsertIdentity('google','meeting-c','c@example.com','C');for(const u of [a,b,c])await store.saveProfile(u.id,{adult:true,name:u.name});
  const p=await store.meetings.offerPair(a.id,b.id);await Promise.all([store.meetings.decide(a.id,p.id,'yes'),store.meetings.decide(b.id,p.id,'yes')]);const created=await store.meetings.createAppointment(a.id,p.id,{activity:'Mostra',startsAt:new Date(Date.now()+86400000).toISOString(),place:'Museo pubblico',cost:'Gratis'});
  const confirmations=await Promise.all([store.meetings.confirm(a.id,created.id,1),store.meetings.confirm(b.id,created.id,1)]);assert.equal(confirmations.filter(Boolean).length,2);let current=await store.meetings.getAppointment(a.id,created.id);assert.equal(current.confirmed_first,1);assert.equal(current.confirmed_second,1);assert.equal(await store.meetings.getAppointment(c.id,created.id),null);
  const data={activity:'Passeggiata',startsAt:new Date(Date.now()+172800000).toISOString(),place:'Piazza pubblica',cost:'Gratis'},revisions=await Promise.all([store.meetings.revise(a.id,created.id,1,data),store.meetings.revise(b.id,created.id,1,data)]);assert.equal(revisions.filter(Boolean).length,1);current=await store.meetings.getAppointment(a.id,created.id);assert.equal(current.version,2);assert.equal(current.confirmed_first,0);assert.equal(current.confirmed_second,0);assert.equal(await store.meetings.confirm(a.id,created.id,1),null);
  await store.deleteAccount(b.id);assert.equal(await store.meetings.getAppointment(a.id,created.id),null);
 }finally{await mf.dispose();}
});
test('D1 quota reservation is atomic under concurrent calls and survives account deletion',async()=>{
 const {mf,store}=await harness();try{const u=await store.upsertIdentity('google','a','a@example.com','A');const jobs=await Promise.all(Array.from({length:6},()=>store.reserveImageAttempt('account',u.id,'portrait')));assert.equal(jobs.filter(x=>x.id).length,1);await store.finishImageAttempt(jobs.find(x=>x.id).id,false);
 for(let i=1;i<12;i++){const job=await store.reserveImageAttempt('account',u.id,'portrait');assert.ok(job.id);await store.finishImageAttempt(job.id,false);}assert.equal((await store.reserveImageAttempt('account',u.id,'portrait')).error,'quota');await store.deleteAccount(u.id);assert.equal((await store.imageUsage('account')).global,12);
 }finally{await mf.dispose();}
});
test('D1 preserves chunked images above 2MB and isolates approval and deletion',async()=>{
 const {mf,store}=await harness();try{const u=await store.upsertIdentity('google','a','a@example.com','A'),b=await store.upsertIdentity('google','b','b@example.com','B');const bytes=Buffer.alloc(2500000,123);const image={bytes,mime:'image/png',model:'test',styleVersion:'test'};
 await store.saveProfileImage(u.id,'portrait','hash',image,'one');assert.equal((await store.getProfileImages(b.id,'portrait')).length,0);assert.deepEqual((await store.getProfileImages(u.id,'portrait'))[0].data,bytes);assert.equal(await store.approveProfileImage(b.id,'portrait','one'),false);assert.ok(await store.approveProfileImage(u.id,'portrait','one'));
 await store.saveProfileImage(u.id,'portrait','hash',image,'two');assert.ok(await store.discardProfileImage(u.id,'portrait','two'));assert.equal((await store.getProfileImages(u.id,'portrait'))[0].id,'one');await store.deleteAccount(u.id);assert.equal((await store.getProfileImages(u.id,'portrait')).length,0);
 }finally{await mf.dispose();}
});
test('D1 storage limit rolls back replacement and keeps the approved image',async()=>{
 const {mf,db,store}=await harness();try{const u=await store.upsertIdentity('google','s','s@example.com','S');const image={bytes:Buffer.alloc(20,1),mime:'image/png',model:'test',styleVersion:'test'};await store.saveProfileImage(u.id,'portrait','hash',image,'approved');await store.approveProfileImage(u.id,'portrait','approved');await db.prepare('UPDATE image_storage_usage SET bytes=199999990 WHERE id=1').run();await assert.rejects(()=>store.saveProfileImage(u.id,'portrait','hash',image,'overflow'));const rows=await store.getProfileImages(u.id,'portrait');assert.equal(rows.length,1);assert.equal(rows[0].id,'approved');
 }finally{await mf.dispose();}
});
test('image mutations enforce the expected draft version inside the write',async()=>{
 const {mf,store}=await harness();try{const u=await store.upsertIdentity('google','v','v@example.com','V');await store.saveIllustratedProfile(u.id,{},0);const image={bytes:Buffer.from('fixture'),mime:'image/png',model:'test',styleVersion:'test'};await store.saveProfileImage(u.id,'portrait','h',image,'old',1);await store.saveIllustratedProfile(u.id,{},1);
 await assert.rejects(()=>store.saveProfileImage(u.id,'portrait','h',image,'stale',1),e=>e.status===409);assert.equal(await store.approveProfileImage(u.id,'portrait','old',1),false);assert.equal((await store.getProfileImages(u.id,'portrait'))[0].id,'old');assert.equal((await store.getProfileImages(u.id,'portrait'))[0].approved,0);
 }finally{await mf.dispose();}
});
test('a read racing deletion returns a complete snapshot or no image, never partial bytes',async()=>{
 const {mf,db,store}=await harness();try{const u=await store.upsertIdentity('google','r','r@example.com','R');const image={bytes:Buffer.alloc(700000,7),mime:'image/png',model:'test',styleVersion:'test'};await store.saveProfileImage(u.id,'portrait','h',image,'read');let once=false;
 const racing={prepare(sql){function wrap(p){return {bind(...args){return wrap(p.bind(...args));},async all(){const rows=await p.all();if(!once&&/FROM profile_images/.test(sql)){once=true;await store.discardProfileImage(u.id,'portrait','read');}return rows;}};}return wrap(db.prepare(sql));}};
 const rows=await createD1Store(racing).getProfileImages(u.id,'portrait');assert.ok(rows.length===0||rows[0].data.equals(image.bytes));
 }finally{await mf.dispose();}
});
