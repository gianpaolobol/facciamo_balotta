import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {createInvitationsStore,INVITATIONS_SCHEMA} from '../server/invitations-store.mjs';
import {createInvitationRoutes,invitationReady,INVITATION_MESSAGE} from '../server/invitations.mjs';
const config={invitationsEnabled:true,invitationUrl:'https://balotta.app/install',invitationHashKey64hex:'ab'.repeat(32)};
const recipient=n=>({channel:'email',address:`friend${n}@domain.org`});
test('ambiguous resolved provider values stay unknown rather than claiming not sent',async()=>{
 for(const result of [{},undefined,{accepted:'true'},{accepted:null},true]){
  const f=fixture(async()=>result);try{const response=await f.request();assert.equal((await response.json()).results[0].status,'unknown');}finally{f.db.close();}
 }
});
function fixture(send=async()=>({accepted:true})){
 const db=new DatabaseSync(':memory:');
 db.exec(`CREATE TABLE users(id TEXT PRIMARY KEY,provider TEXT,subject TEXT);CREATE TABLE sessions(hash TEXT,user_id TEXT,expires INTEGER);CREATE TABLE profiles(user_id TEXT,data TEXT);CREATE TABLE user_safety(user_id TEXT,suspended INTEGER);${INVITATIONS_SCHEMA}`);
 const queries={first:(sql,...args)=>db.prepare(sql).get(...args)||null,all:(sql,...args)=>db.prepare(sql).all(...args)};
 const store={invitations:createInvitationsStore(queries)},calls=[];
 const provider={freePlanConfirmed:true,anonymousSender:true,channels:['email','phone'],send:async input=>{calls.push(input);return send(input);}};
 const route=createInvitationRoutes({store,config,invitationProvider:provider});
 function actor(id='u',subject=id){db.prepare('INSERT INTO users VALUES(?,?,?)').run(id,'google',subject);db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(id,id,Date.now()+100000);db.prepare('INSERT INTO profiles VALUES(?,?)').run(id,'{"adult":true}');}
 actor();
 const request=(recipients=[recipient(0)],batchId=randomUUID(),id='u',extra={})=>route({path:'/api/invitations',request:new Request('https://balotta.app/api/invitations',{method:'POST'}),user:{id},sessionHash:id,jsonBody:async()=>({batchId,recipients,anonymityAcknowledged:true,...extra})});
 return {db,store,calls,provider,route,actor,request};
}
test('invitations fail closed unless official anonymous free adapter, real URL and hash secret are configured',()=>{
 assert.equal(invitationReady(config,null),false);
 const provider={freePlanConfirmed:true,anonymousSender:true,channels:['email'],send(){}};
 assert.equal(invitationReady(config,provider),true);
 for(const override of [{invitationsEnabled:false},{invitationUrl:'https://example.com'},{invitationUrl:'http://balotta.app'},{invitationUrl:'https://balotta.app/?ref=u'},{invitationHashKey64hex:''}])assert.equal(invitationReady({...config,...override},provider),false);
 for(const override of [{freePlanConfirmed:false},{anonymousSender:false},{channels:[]},{channels:['fax']}])assert.equal(invitationReady(config,{...provider,...override}),false);
});
test('validation is all-or-nothing, sends are separate and no plaintext is persisted',async()=>{
 const f=fixture();try{
  for(const recipients of [[],[recipient(1),{channel:'fax',address:'abc'}],Array.from({length:21},(_,i)=>recipient(i))])assert.equal((await f.request(recipients)).status,400);
  assert.equal((await f.request([recipient(0)],randomUUID(),'u',{anonymityAcknowledged:false})).status,400);
  assert.equal(f.calls.length,0);assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM invitation_batches').get().n,0);
  f.provider.channels=['email'];assert.equal((await f.request([{channel:'phone',address:'+393331234567'}])).status,400);assert.equal(f.calls.length,0);f.provider.channels=['email','phone'];
  const batch=randomUUID(),response=await f.request([recipient(1),recipient(1),{channel:'phone',address:'+393331234567'}],batch);
  assert.equal(response.status,200);assert.deepEqual((await response.json()).results.map(r=>r.status),['accepted','accepted']);
  assert.equal(f.calls.length,2);assert.equal(f.calls[0].message,INVITATION_MESSAGE);assert.equal(f.calls[0].link,config.invitationUrl);assert.equal(f.calls[0].signal instanceof AbortSignal,true);
  assert.deepEqual(Object.keys(f.calls[0]).sort(),['address','channel','idempotencyKey','link','message','signal'].sort());
  const persisted=JSON.stringify(f.db.prepare('SELECT * FROM invitation_batches').all());assert.doesNotMatch(persisted,/friend1|393331234567|google|\"u\"/);
  await f.request([recipient(1),{channel:'phone',address:'+393331234567'}],batch);assert.equal(f.calls.length,2);
  assert.equal((await f.request([recipient(9)],batch)).status,409);assert.equal(f.calls.length,2);
 }finally{f.db.close();}
});
test('concurrent retries never duplicate in-flight sends and failures still consume quota',async()=>{
 let unblock;const gate=new Promise(resolve=>{unblock=resolve;});
 const f=fixture(async()=>{await gate;return {accepted:false};});try{
  const batch=randomUUID(),first=f.request(Array.from({length:20},(_,i)=>recipient(i)),batch);
  while(f.calls.length===0)await new Promise(resolve=>setImmediate(resolve));
  const retry=await f.request(Array.from({length:20},(_,i)=>recipient(i)),batch);
  assert.equal((await retry.json()).results[0].status,'unknown');assert.equal(f.calls.length,1);
  assert.equal((await f.request([recipient(21)])).status,429);
  unblock();assert.equal((await (await first).json()).results.every(r=>r.status==='failed'),true);assert.equal(f.calls.length,20);
  await f.request(Array.from({length:20},(_,i)=>recipient(i)),batch);assert.equal(f.calls.length,20);
 }finally{unblock();f.db.close();}
});
test('atomic global quota rejects entire batch and usage survives account deletion and recreation',async()=>{
 const f=fixture();try{
  await f.request(Array.from({length:20},(_,i)=>recipient(i)));
  f.db.prepare('DELETE FROM users WHERE id=?').run('u');f.db.prepare('DELETE FROM sessions WHERE user_id=?').run('u');f.actor('u2','u');
  assert.equal((await f.request([recipient(30)],randomUUID(),'u2')).status,429);
  f.actor('b');f.actor('c');f.actor('d');
  const responses=await Promise.all(['b','c','d'].map(id=>f.request(Array.from({length:20},(_,i)=>recipient(i)),randomUUID(),id)));
  assert.equal(responses.filter(r=>r.status===200).length,1);assert.equal(responses.filter(r=>r.status===429).length,2);
  assert.equal(f.db.prepare('SELECT SUM(recipient_count) AS n FROM invitation_batches').get().n,40);
  const unused=['b','c','d'][responses.findIndex(r=>r.status===429)];
  assert.equal((await f.request(Array.from({length:10},(_,i)=>recipient(i)),randomUUID(),unused)).status,200);
 }finally{f.db.close();}
});
test('revoked sessions, suspension and adult eligibility are checked again between individual sends',async()=>{
 for(const change of [db=>db.exec('DELETE FROM sessions'),db=>db.exec("INSERT INTO user_safety VALUES('u',1)"),db=>db.exec("UPDATE profiles SET data='{}'"),db=>db.exec('DELETE FROM users')]){
  let f;f=fixture(async()=>{change(f.db);return {accepted:true};});try{
   const response=await f.request([recipient(1),recipient(2)]);assert.deepEqual((await response.json()).results.map(r=>r.status),['accepted','failed']);assert.equal(f.calls.length,1);
   assert.equal((await f.request()).status,403);
  }finally{f.db.close();}
 }
});
test('ambiguous provider errors remain unknown on retry and ledger prunes after seven days',async()=>{
 const f=fixture(async()=>{throw new Error('provider may already have sent');});try{
  const batch=randomUUID();assert.equal((await (await f.request([recipient(1)],batch)).json()).results[0].status,'unknown');
  await f.request([recipient(1)],batch);assert.equal(f.calls.length,1);
  f.db.exec(`UPDATE invitation_batches SET created=${Date.now()-8*86400000}`);
  await f.request([recipient(2)]);assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM invitation_batches').get().n,1);
 }finally{f.db.close();}
});
test('provider timeout aborts at ten seconds, remains unknown, and cannot be resent',async()=>{
 const f=fixture(()=>new Promise(()=>{}));try{
  const batch=randomUUID(),start=Date.now();
  const response=await f.request([recipient(1)],batch);
  assert.equal((await response.json()).results[0].status,'unknown');assert.equal(f.calls[0].signal.aborted,true);
  assert.ok(Date.now()-start>=9900);assert.ok(Date.now()-start<12000);
  await f.request([recipient(1)],batch);assert.equal(f.calls.length,1);
 }finally{f.db.close();}
});

test('production route with no provider remains unavailable without touching recipients or database',async()=>{
 const route=createInvitationRoutes({store:{},config});
 const response=await route({path:'/api/invitations',request:new Request('https://balotta.app/api/invitations',{method:'POST'}),user:{id:'u'},jsonBody:async()=>{throw new Error('must not parse');}});
 assert.equal(response.status,503);
});
