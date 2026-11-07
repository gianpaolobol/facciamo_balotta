import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {createApp} from '../server/auth.mjs';import {createStore} from '../server/store.mjs';import {emptyIllustratedDraft} from '../src/illustrated-draft.mjs';
const origin='https://balotta.example',base='/api/illustrated-profile';
function harness(generate){
 const store=createStore(':memory:');let calls=0;
 const imageProvider={ready:true,accountId:'a'.repeat(32),model:'test-free',async generate(input){calls++;if(generate)return generate(input);return {bytes:Buffer.from('test-image'),mime:'image/png',model:'test-free',styleVersion:'balotta-ink-1'};}};
 const app=createApp({store,config:{origin},imageProvider});const users=[0,1].map(i=>{const u=store.upsertIdentity('google',String(i),'test'+i+'@example.com','Ada'),token=String(i).repeat(43);store.putSession(createHash('sha256').update(token).digest('base64url'),u.id);store.saveProfile(u.id,{name:'Ada',adult:true,city:'Bologna',interests:[]});const draft=emptyIllustratedDraft();draft.fields.portrait='Capelli corti';draft.confirmed.portrait='Capelli corti';store.saveIllustratedProfile(u.id,draft,0);return {...u,token};});
 const req=(path,body,who=0)=>app(new Request(origin+base+path,{method:body?'POST':'GET',headers:{cookie:'balotta_session='+users[who].token,origin,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}));
 return {store,users,req,get calls(){return calls;}};
}
test('generated images stay private and require separate image approval',async()=>{
 const h=harness();try{
 let response=await h.req('/generate',{slot:'portrait',version:1});assert.equal(response.status,200);const first=(await response.json()).image;assert.ok(first.id);assert.equal(first.approved,false);
 assert.equal((await h.req('/images/portrait','',1)).status,200);assert.equal((await (await h.req('/images/portrait','',1)).json()).image,null);
 assert.equal((await h.req('/approve',{slot:'portrait',version:1,id:first.id},1)).status,404);
 response=await h.req('/approve',{slot:'portrait',version:1,id:first.id});assert.equal(response.status,200);assert.equal((await response.json()).image.approved,true);
 const next=await (await h.req('/generate',{slot:'portrait',version:1})).json();assert.notEqual(next.image.id,first.id);assert.equal(next.approvedId,first.id);
 const kept=await h.req('/discard',{slot:'portrait',version:1,id:next.image.id});assert.equal(kept.status,200);assert.equal((await kept.json()).image.id,first.id);
 }finally{h.store.close();}
});
test('stale versions, unconfirmed text, unknown slots and underage profiles cannot trigger generation',async()=>{
 const h=harness();try{
 for(const body of [{slot:'portrait',version:0},{slot:'interest-1',version:1},{slot:'interest-6',version:1}])assert.ok((await h.req('/generate',body)).status>=400);
 h.store.saveProfile(h.users[0].id,{adult:false});assert.equal((await h.req('/generate',{slot:'portrait',version:1})).status,403);assert.equal(h.calls,0);
 }finally{h.store.close();}
});
test('a late generated image cannot attach to a changed description',async()=>{
 let finish;const h=harness(()=>new Promise(resolve=>finish=()=>resolve({bytes:Buffer.from('image'),mime:'image/png',model:'test',styleVersion:'test'})));
 try{const pending=h.req('/generate',{slot:'portrait',version:1});for(let i=0;i<30&&!finish;i++)await new Promise(resolve=>setImmediate(resolve));assert.ok(finish,'generation started');const snap=h.store.getIllustratedProfile(h.users[0].id);snap.draft.fields.portrait='Modificata';delete snap.draft.confirmed.portrait;h.store.saveIllustratedProfile(h.users[0].id,snap.draft,1);finish();assert.equal((await pending).status,409);assert.equal((await (await h.req('/images/portrait')).json()).image,null);
 }finally{h.store.close();}
});
test('pending generations block duplicate requests and provider failures retain the quota reservation',async()=>{
 let finish;const h=harness(()=>new Promise((_,reject)=>finish=()=>reject(Error('upstream'))));
 try{const pending=h.req('/generate',{slot:'portrait',version:1});for(let i=0;i<30&&!finish;i++)await new Promise(resolve=>setImmediate(resolve));assert.ok(finish,'generation started');assert.equal((await h.req('/generate',{slot:'portrait',version:1})).status,409);finish();assert.equal((await pending).status,503);assert.equal(h.calls,1);assert.equal(h.store.imageUsage('a'.repeat(32)).global,1);
 }finally{h.store.close();}
});
test('the global daily budget cannot be reset by deleting an account',()=>{
 const h=harness();try{const account='a'.repeat(32);for(let i=0;i<50;i++){const user=h.store.upsertIdentity('google','quota-'+i,'q@example.com','Q');const job=h.store.reserveImageAttempt(account,user.id,'portrait');assert.ok(job.id);h.store.finishImageAttempt(job.id,false);h.store.deleteAccount(user.id);}
 assert.equal(h.store.imageUsage(account).global,50);assert.equal(h.store.reserveImageAttempt(account,h.users[0].id,'portrait').error,'quota');
 }finally{h.store.close();}
});
test('each user has at most twelve attempts within the shared free daily budget',()=>{
 const h=harness();try{for(let i=0;i<12;i++){const job=h.store.reserveImageAttempt('a'.repeat(32),h.users[0].id,'portrait');assert.ok(job.id);h.store.finishImageAttempt(job.id,false);}
 assert.equal(h.store.reserveImageAttempt('a'.repeat(32),h.users[0].id,'portrait').error,'quota');assert.ok(h.store.reserveImageAttempt('a'.repeat(32),h.users[1].id,'portrait').id);
 }finally{h.store.close();}
});
test('unauthenticated requests cannot read, generate or approve profile images',async()=>{
 const h=harness();try{for(const path of ['/generate','/approve','/images/portrait','/ai-status']){const method=path==='/generate'||path==='/approve'?'POST':'GET';const response=await createApp({store:h.store,config:{origin}})(new Request(origin+base+path,{method,...(method==='POST'?{body:'{}'}:{})}));assert.equal(response.status,401);}
 }finally{h.store.close();}
});
test('deleting an account during a pending generation drops the result and preserves spent budget',async()=>{
 let finish;const h=harness(()=>new Promise(resolve=>finish=()=>resolve({bytes:Buffer.from('image'),mime:'image/png',model:'test',styleVersion:'test'})));
 try{const pending=h.req('/generate',{slot:'portrait',version:1});for(let i=0;i<30&&!finish;i++)await new Promise(resolve=>setImmediate(resolve));assert.ok(finish);h.store.deleteAccount(h.users[0].id);finish();assert.equal((await pending).status,409);assert.equal(h.store.getProfileImages(h.users[0].id,'portrait').length,0);assert.equal(h.store.imageUsage('a'.repeat(32)).global,1);
 }finally{h.store.close();}
});
test('usage and approved images survive closing and reopening SQLite',async()=>{
 const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const dir=mkdtempSync(join(tmpdir(),'balotta-ai-'));const file=join(dir,'db.sqlite');let store=createStore(file);
 try{const user=store.upsertIdentity('google','persistent','test@example.com','Ada');const job=store.reserveImageAttempt('a'.repeat(32),user.id,'portrait');store.saveProfileImage(user.id,'portrait','hash',{bytes:Buffer.from('image'),mime:'image/png',model:'test',styleVersion:'test'},job.id);store.approveProfileImage(user.id,'portrait',job.id);store.finishImageAttempt(job.id,true);store.close();store=createStore(file);
 assert.equal(store.imageUsage('a'.repeat(32)).global,1);const image=store.getProfileImages(user.id,'portrait')[0];assert.equal(image.approved,1);assert.equal(Buffer.from(image.data).toString(),'image');
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});
