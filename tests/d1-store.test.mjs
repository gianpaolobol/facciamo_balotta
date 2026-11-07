import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';import {createD1Store} from '../server/d1-store.mjs';import {createApp} from '../server/auth.mjs';import {createHash} from 'node:crypto';
async function harness(){const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("test")}}',d1Databases:{DB:'test'}}));const db=await mf.getD1Database('DB');const sql=await readFile(new URL('../migrations/0001_backend.sql',import.meta.url),'utf8');await db.batch(sql.trim().split(/;\s*(?=(?:CREATE|INSERT|PRAGMA)\b)/i).map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));return {mf,db,store:createD1Store(db)};}
test('D1 drives authenticated API and versioned profile writes',async()=>{
 const {mf,store}=await harness();try{const user=await store.upsertIdentity('google','a','a@example.com','Ada'),token='a'.repeat(43);await store.putSession(createHash('sha256').update(token).digest('base64url'),user.id);const app=createApp({store,config:{origin:'https://balotta.example'}}),headers={authorization:'Bearer '+token};assert.equal((await (await app(new Request('https://balotta.example/api/session',{headers}))).json()).user.id,user.id);
 assert.equal((await store.saveIllustratedProfile(user.id,{fields:{},confirmed:{}},0)).version,1);assert.equal(await store.saveIllustratedProfile(user.id,{},0),null);
 const writes=await Promise.all([store.saveIllustratedProfile(user.id,{x:1},1),store.saveIllustratedProfile(user.id,{x:2},1)]);assert.equal(writes.filter(Boolean).length,1);
 await store.putAttempt('a',{test:true});const attempts=await Promise.all([store.takeAttempt('a'),store.takeAttempt('a')]);assert.equal(attempts.filter(Boolean).length,1);
 await store.putHandoff('h',user.id,'challenge');assert.ok(await store.takeHandoff('h'));assert.equal(await store.takeHandoff('h'),null);
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
