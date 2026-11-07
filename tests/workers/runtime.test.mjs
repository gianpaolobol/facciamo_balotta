import {applyLocalMigrations} from '../support/d1-migrations.mjs';
import {appleFixture,appleIdentity,appleJWT} from '../support/apple-fixture.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFile,writeFile,readdir} from 'node:fs/promises';import {resolve} from 'node:path';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';import {createD1Store} from '../../server/d1-store.mjs';import {createHash,generateKeyPairSync,sign} from 'node:crypto';
const directory=resolve(process.env.WORKER_BUNDLE_DIR||'.worker-test-bundle');
test('bundled Worker gates official invitations and D1 reserves concurrent batches once',async()=>{
 const {mf,store}=await harness({INVITATIONS_ENABLED:'true',INVITATION_URL:'https://facciamobalotta.it/app',INVITATION_HASH_KEY64HEX:'ab'.repeat(32)});
 try{
  const u=await store.upsertIdentity('google','invitation-test','invite@example.test','Test'),raw='n'.repeat(43),hash=createHash('sha256').update(raw).digest('base64url');await store.putSession(hash,u.id);await store.saveProfile(u.id,{adult:true});
  const config=await(await mf.dispatchFetch('https://balotta.example/api/config')).json();assert.equal(config.features.invitations,false);assert.deepEqual(config.invitationChannels,[]);
  assert.equal((await mf.dispatchFetch('https://balotta.example/api/invitations',{method:'POST',headers:{authorization:'Bearer '+raw,'content-type':'application/json'},body:'{}'})).status,503);
  assert.equal((await store.invitations.actor(hash,u.id)).id,u.id);
  const input={accountHash:'a'.repeat(64),batchId:'runtime-invitations',fingerprint:'b'.repeat(64),contacts:['c'.repeat(64),'d'.repeat(64)]};
  const writes=await Promise.all([store.invitations.reserve(input),store.invitations.reserve(input)]);assert.equal(writes.filter(r=>r.owner).length,1);
  await store.invitations.finish(input.accountHash,input.batchId,0,'accepted');assert.deepEqual(JSON.parse((await store.invitations.statuses(input.accountHash,input.batchId)).statuses),['accepted','unknown']);
  await store.dropSession(hash);assert.equal(await store.invitations.actor(hash,u.id),null);
 }finally{await mf.dispose();}
});
test('bundled Worker stores push consent encrypted in D1 and revokes on logout',async()=>{
 const projectId='b12d747a-2ade-4894-a847-381026c7089a';
 const {mf,store}=await harness({PUSH_ENABLED:'true',PUSH_PROJECT_ID:projectId,PUSH_ENCRYPTION_KEY:'ab'.repeat(32),EXPO_ACCESS_TOKEN:'runtime-test-access'});
 try{
  const user=await store.upsertIdentity('google','push-runtime','push@example.test','Test'),raw='p'.repeat(43),hash=createHash('sha256').update(raw).digest('base64url');await store.putSession(hash,user.id);await store.saveProfile(user.id,{adult:true,city:'Bologna',interests:[]});
  const body={installationId:'768ce2e2-1038-4a07-a064-82fa4a8d1650',installationSecret:'de'.repeat(32),token:'ExpoPushToken[runtime_synthetic_token_123]',projectId},headers={authorization:'Bearer '+raw,'content-type':'application/json'};
  const req=(path,init={})=>mf.dispatchFetch('https://balotta.example'+path,init);
  assert.equal((await(await req('/api/config')).json()).features.push,true);
  assert.equal((await req('/api/push/device',{method:'POST',headers,body:JSON.stringify(body)})).status,200);
  assert.deepEqual(await(await req('/api/push/device',{headers})).json(),{enabled:true});
  const db=await mf.getD1Database('DB'),stored=await db.prepare('SELECT * FROM push_devices').first();assert.doesNotMatch(JSON.stringify(stored),/runtime_synthetic|dededede/);
  const peer=await store.upsertIdentity('google','push-peer','peer@example.test','Peer');await store.saveProfile(peer.id,{adult:true});const participants=[user.id,peer.id].sort();
  await db.prepare('INSERT INTO pairings(id,first_user,second_user,created) VALUES(?,?,?,?)').bind('runtime-push-pair',...participants,Date.now()).run();
  assert.equal((await store.push.candidates(Date.now())).some(d=>d.user_id===user.id),true);
  await db.prepare('INSERT INTO user_blocks VALUES(?,?,?)').bind(peer.id,user.id,Date.now()).run();assert.equal((await store.push.candidates(Date.now())).length,0);
  assert.equal((await req('/api/logout',{method:'POST',headers})).status,200);assert.equal((await db.prepare('SELECT count(*) AS n FROM push_devices').first()).n,0);
  assert.equal((await req('/auth/push/disable',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({installationId:body.installationId,installationSecret:body.installationSecret})})).status,200);
 }finally{await mf.dispose();}
});
async function harness(vars={}){
 const wrapper=resolve(directory,'test-wrapper.mjs');await writeFile(wrapper,`import worker from './index.js';export default {fetch(request,env){globalThis.fetch=async (url,init)=>{if(String(url)==='https://appleid.apple.com/auth/keys'&&env.TEST_APPLE_JWK)return Response.json({keys:[JSON.parse(env.TEST_APPLE_JWK)]});if(env.TEST_APPLE_REVOCATION==='true'){const p=new URLSearchParams(init.body);if(String(url)==='https://appleid.apple.com/auth/token')return Response.json({id_token:p.get('code'),refresh_token:'runtime-refresh'});if(String(url)==='https://appleid.apple.com/auth/revoke'&&p.get('token')==='runtime-refresh'&&p.get('token_type_hint')==='refresh_token')return new Response(null,{status:200});}throw Error('External requests prohibited in local runtime tests');};return worker.fetch(request,{...env,AI:{async run(model,input){if(!model.endsWith('flux-2-klein-4b')||!input.multipart?.contentType.includes('boundary='))throw Error('Invalid binding invocation');return {image:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jw1sAAAAASUVORK5CYII='}}}})}};`);
 const modules=await Promise.all((await readdir(directory)).filter(name=>name==='index.js'||name==='test-wrapper.mjs'||name.endsWith('.jpg')).sort((a,b)=>a==='test-wrapper.mjs'?-1:b==='test-wrapper.mjs'?1:0).map(async name=>({type:name.endsWith('.jpg')?'Data':'ESModule',path:resolve(directory,name),contents:name.endsWith('.jpg')?new Uint8Array(await readFile(resolve(directory,name))):await readFile(resolve(directory,name),'utf8')})));
 const mf=new Miniflare(convertV4MiniflareOptions({modules,modulesRoot:directory,compatibilityDate:'2026-11-07',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'runtime'},bindings:{PUBLIC_ORIGIN:'https://balotta.example',CLOUDFLARE_FREE_PLAN_CONFIRMED:'false',...vars}}));
 const db=await mf.getD1Database('DB');await applyLocalMigrations(db);return {mf,store:createD1Store(db)};
}
test('bundled Worker serves native sessions and profile data through real local D1',async()=>{
 const {mf,store}=await harness();try{
 const user=await store.upsertIdentity('google','a','a@example.com','Ada'),verifier='v'.repeat(64);await store.putHandoff(createHash('sha256').update('code').digest('base64url'),user.id,createHash('sha256').update(verifier).digest('base64url'));
 const exchange=await mf.dispatchFetch('https://balotta.example/auth/native/exchange',{method:'POST',body:JSON.stringify({code:'code',verifier})});assert.equal(exchange.status,200);const token=(await exchange.json()).token,headers={authorization:'Bearer '+token,'content-type':'application/json'};
 assert.equal((await mf.dispatchFetch('https://balotta.example/auth/native/exchange',{method:'POST',body:JSON.stringify({code:'code',verifier})})).status,400);
 assert.equal((await (await mf.dispatchFetch('https://balotta.example/api/session',{headers})).json()).user.id,user.id);
 const put=await mf.dispatchFetch('https://balotta.example/api/profile',{method:'PUT',headers,body:JSON.stringify({name:'Ada',adult:true,city:'Bologna',interests:[]})});assert.equal(put.status,200);assert.equal((await store.getProfile(user.id)).name,'Ada');
 assert.equal((await (await mf.dispatchFetch('https://balotta.example/api/illustrated-profile/ai-status',{headers})).json()).enabled,false);
 assert.equal((await mf.dispatchFetch('https://balotta.example/api/profile',{method:'PUT',headers,body:'a'.repeat(17000)})).status,413);
 }finally{await mf.dispose();}
});
test('AI binding integration generates and approves only a synthetic local fixture',async()=>{
 const {mf,store}=await harness({CLOUDFLARE_FREE_PLAN_CONFIRMED:'true'});try{
 const u=await store.upsertIdentity('google','a','a@example.com','A'),token='a'.repeat(43);await store.putSession(createHash('sha256').update(token).digest('base64url'),u.id);await store.saveProfile(u.id,{adult:true});await store.saveIllustratedProfile(u.id,{fields:{portrait:'Adulto'},confirmed:{portrait:'Adulto'}},0);const headers={authorization:'Bearer '+token,'content-type':'application/json'};
 const generated=await mf.dispatchFetch('https://balotta.example/api/illustrated-profile/generate',{method:'POST',headers,body:JSON.stringify({slot:'portrait',version:1})});assert.equal(generated.status,200);const image=(await generated.json()).image;assert.equal(image.approved,false);assert.match(image.dataUri,/^data:image\/png;base64,/);
 const approved=await mf.dispatchFetch('https://balotta.example/api/illustrated-profile/approve',{method:'POST',headers,body:JSON.stringify({slot:'portrait',version:1,id:image.id})});assert.equal(approved.status,200);assert.equal((await approved.json()).image.approved,true);assert.equal((await store.imageUsage('worker-binding')).global,1);
 }finally{await mf.dispose();}
});
test('unconfigured origin and anonymous session fail closed',async()=>{
 const {mf}=await harness({PUBLIC_ORIGIN:'https://configure-before-deploy.invalid'});try{assert.equal((await mf.dispatchFetch('https://balotta.example/api/config')).status,503);}finally{await mf.dispose();}
 const h=await harness();try{assert.equal((await h.mf.dispatchFetch('https://balotta.example/api/profile')).status,401);}finally{await h.mf.dispose();}
});
test('bundled Worker verifies a synthetic Apple signature and persists one native session in D1',async()=>{
 const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048}),jwk={...publicKey.export({format:'jwk'}),kid:'runtime-key',alg:'RS256',use:'sig'};
 const {mf}=await harness({OAUTH_ENABLED:'true',APPLE_NATIVE_ENABLED:'true',APPLE_BUNDLE_ID:'it.facciamobalotta.app',BETA_ALLOWED_EMAILS:'tester@example.com',TEST_APPLE_JWK:JSON.stringify(jwk)});
 try{
  const verifier='v'.repeat(64),challenge=createHash('sha256').update(verifier).digest('base64url');
  const begin=await mf.dispatchFetch('https://balotta.example/auth/apple/native/start',{method:'POST',body:JSON.stringify({challenge})});assert.equal(begin.status,200);const {attempt,nonce}=await begin.json(),now=Math.floor(Date.now()/1000);
  const head=Buffer.from(JSON.stringify({alg:'RS256',kid:'runtime-key'})).toString('base64url'),claims=Buffer.from(JSON.stringify({iss:'https://appleid.apple.com',aud:'it.facciamobalotta.app',sub:'runtime-apple',email:'tester@example.com',email_verified:true,iat:now,exp:now+600,nonce})).toString('base64url'),input=head+'.'+claims,identityToken=input+'.'+sign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url');
  const body=JSON.stringify({attempt,verifier,identityToken}),results=await Promise.all([mf.dispatchFetch('https://balotta.example/auth/apple/native/exchange',{method:'POST',body}),mf.dispatchFetch('https://balotta.example/auth/apple/native/exchange',{method:'POST',body})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,400]);const {token}=await results.find(r=>r.status===200).json();
  const current=await mf.dispatchFetch('https://balotta.example/api/session',{headers:{authorization:'Bearer '+token}});assert.equal((await current.json()).user.email,'tester@example.com');
  assert.equal((await mf.dispatchFetch('https://balotta.example/auth/apple/native/exchange',{method:'POST',body})).status,400);
 }finally{await mf.dispose();}
});
test('bundled Worker revokes synthetic Apple authorization before account deletion',async()=>{
 const {mf,store}=await harness({OAUTH_ENABLED:'true',APPLE_NATIVE_ENABLED:'true',BETA_ALLOWED_EMAILS:'tester@example.com',APPLE_BUNDLE_ID:'it.facciamobalotta.app',APPLE_TEAM_ID:'TEAM123456',APPLE_KEY_ID:'KEY1234567',APPLE_PRIVATE_KEY:appleFixture.privatePem,TEST_APPLE_JWK:JSON.stringify(appleFixture.jwk),TEST_APPLE_REVOCATION:'true'});
 try{
  const u=await store.upsertIdentity('apple','apple-owner','tester@example.com',''),token='s'.repeat(43),headers={authorization:'Bearer '+token};await store.putSession(createHash('sha256').update(token).digest('base64url'),u.id);
  const verifier='v'.repeat(64),challenge=createHash('sha256').update(verifier).digest('base64url'),pending=await (await mf.dispatchFetch('https://balotta.example/auth/apple/native/start',{method:'POST',body:JSON.stringify({challenge})})).json(),pendingToken=appleIdentity(pending.nonce,{iat:Math.floor(Date.now()/1000)-1});
  const begin=await mf.dispatchFetch('https://balotta.example/api/account/apple/start',{method:'POST',headers,body:JSON.stringify({challenge})});assert.equal(begin.status,200);const a=await begin.json(),identityToken=appleIdentity(a.nonce);
  const deleted=await mf.dispatchFetch('https://balotta.example/api/account/apple/delete',{method:'POST',headers,body:JSON.stringify({attempt:a.attempt,verifier,identityToken,authorizationCode:identityToken})});assert.equal(deleted.status,200);assert.equal(await store.getIdentity(u.id),null);assert.equal((await mf.dispatchFetch('https://balotta.example/api/session',{headers})).status,401);
  assert.equal((await mf.dispatchFetch('https://balotta.example/auth/apple/native/exchange',{method:'POST',body:JSON.stringify({attempt:pending.attempt,verifier,identityToken:pendingToken})})).status,401);
  const db=await mf.getD1Database('DB');assert.equal((await db.prepare("SELECT count(*) AS n FROM users WHERE provider='apple' AND subject='apple-owner'").first()).n,0);
 }finally{await mf.dispose();}
});
test('bundled Worker applies signed Apple notifications once and blocks stale sessions',async()=>{
 const {mf,store}=await harness({APPLE_BUNDLE_ID:'it.facciamobalotta.app',APPLE_NOTIFICATIONS_ENABLED:'true',TEST_APPLE_JWK:JSON.stringify(appleFixture.jwk)});
 try{
  const u=await store.upsertIdentity('apple','apple-owner','tester@example.com',''),now=Math.floor(Date.now()/1000);await store.putSession('before',u.id);
  const body=JSON.stringify({payload:appleJWT({jti:'runtime-event',events:{type:'consent-revoked',sub:'apple-owner',event_time:now}})});
  const results=await Promise.all([mf.dispatchFetch('https://balotta.example/auth/apple/notifications',{method:'POST',body}),mf.dispatchFetch('https://balotta.example/auth/apple/notifications',{method:'POST',body})]);assert.deepEqual(results.map(r=>r.status),[200,200]);assert.equal(await store.getSession('before'),null);assert.equal(await store.putAppleSession('stale',u.id,now-1),false);
  assert.equal(await store.putAppleSession('after',u.id,now+1),true);assert.equal((await mf.dispatchFetch('https://balotta.example/auth/apple/notifications',{method:'POST',body})).status,200);assert.ok(await store.getSession('after'));
  const delayed=JSON.stringify({payload:appleJWT({jti:'runtime-delayed',events:{type:'consent-revoked',sub:'apple-owner',event_time:now-30}})});assert.equal((await mf.dispatchFetch('https://balotta.example/auth/apple/notifications',{method:'POST',body:delayed})).status,200);assert.ok(await store.getSession('after'));
 }finally{await mf.dispose();}
});
test('bundled Worker persists mutual-interest appointments and enforces versioned double confirmation',async()=>{
 const {mf,store}=await harness({MEETINGS_ENABLED:'true'});try{
  const users={};for(const who of ['a','b','c']){users[who]=await store.upsertIdentity('google','meeting-'+who,who+'@example.com',who);await store.saveProfile(users[who].id,{adult:true,name:who});await store.putSession(createHash('sha256').update(who.repeat(43)).digest('base64url'),users[who].id);}
  const req=(who,path,method='GET',body)=>mf.dispatchFetch('https://balotta.example'+path,{method,headers:{authorization:'Bearer '+who.repeat(43),'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const pair=await store.meetings.offerPair(users.a.id,users.b.id);for(const who of ['a','b'])assert.equal((await req(who,'/api/pairings/'+pair.id+'/decision','POST',{decision:'yes'})).status,200);
  const made=await req('a','/api/pairings/'+pair.id+'/appointment','POST',{activity:'Due passi',startsAt:new Date(Date.now()+86400000).toISOString(),place:'Piazza pubblica',cost:'Gratis',publicPlace:true});assert.equal(made.status,201);const a=(await made.json()).appointment,path='/api/appointments/'+a.id;
  assert.equal((await req('c',path)).status,404);const results=await Promise.all(['a','b'].map(who=>req(who,path+'/confirm','POST',{version:1})));assert.deepEqual(results.map(r=>r.status),[200,200]);assert.equal((await (await req('a',path)).json()).appointment.status,'confirmed');
  assert.equal((await req('b',path,'PATCH',{version:1,changes:{place:'Ingresso museo pubblico'}})).status,200);assert.equal((await req('a',path+'/confirm','POST',{version:1})).status,409);const revised=(await (await req('a',path)).json()).appointment;assert.equal(revised.version,2);assert.deepEqual(revised.confirmations,[]);
 }finally{await mf.dispose();}
});
test('bundled Worker integrates opt-in matching, approved portraits, private chat and moderation',async()=>{
 const {mf,store}=await harness({MEETINGS_ENABLED:'true',MATCHING_ENABLED:'true',GROUPS_ENABLED:'true',COMMUNITY_ENABLED:'true',NOTIFICATIONS_ENABLED:'true',MODERATOR_EMAILS:'c@example.com'});try{
  const users={};for(const id of ['a','b','c']){users[id]=await store.upsertIdentity('google','social-'+id,id+'@example.com',id);await store.saveProfile(users[id].id,{adult:true,name:id,city:'Bologna',interests:['Passeggiate']});await store.putSession(createHash('sha256').update(id.repeat(43)).digest('base64url'),users[id].id);}
  const req=(who,path,method='GET',body)=>mf.dispatchFetch('https://balotta.example'+path,{method,headers:{authorization:'Bearer '+who.repeat(43),'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const preference={enabled:true,accepted:true,policyVersion:'2026-11-07',intent:'friendship',scope:'province',availability:['weekend_day']};for(const who of ['a','b'])assert.equal((await req(who,'/api/preferences','PUT',preference)).status,200);
  const data=await (await req('a','/api/pairings')).json();assert.equal(data.pairings.length,1);const pair=data.pairings[0];assert.deepEqual(pair.reasons,['Passeggiate']);assert.doesNotMatch(JSON.stringify(data),/@example.com/);const updates=await (await req('a','/api/notifications')).json();assert.ok(updates.unread>0);assert.equal((await req('c','/api/notifications/'+updates.notifications[0].id+'/read','POST',{})).status,404);assert.equal((await req('a','/api/notifications/'+updates.notifications[0].id+'/read','POST',{})).status,200);assert.equal((await (await req('c','/api/notifications')).json()).unread,0);
  await store.saveProfileImage(users.b.id,'portrait','private-hash',{bytes:Buffer.from('synthetic-image'),mime:'image/png',model:'fixture',styleVersion:'fixture'},'social-portrait');await store.approveProfileImage(users.b.id,'portrait','social-portrait');
  assert.ok((await (await req('a','/api/pairings/'+pair.id+'/illustrations/portrait')).json()).image);assert.equal((await req('c','/api/pairings/'+pair.id+'/illustrations/portrait')).status,404);
  for(const who of ['a','b'])assert.equal((await req(who,'/api/pairings/'+pair.id+'/decision','POST',{decision:'yes'})).status,200);
  const messageId=crypto.randomUUID();assert.equal((await req('b','/api/chat/pair/'+pair.id,'POST',{id:messageId,body:'Ci troviamo in piazza?'})).status,201);assert.equal((await req('c','/api/chat/pair/'+pair.id)).status,404);assert.equal((await req('a','/api/notifications/read-all','POST',{})).status,200);assert.equal((await (await req('a','/api/notifications')).json()).unread,0);
  assert.equal((await req('a','/api/reports','POST',{messageId,reason:'Verifica del messaggio nella prova locale'})).status,201);assert.equal((await req('a','/api/moderation/reports')).status,403);const reports=(await (await req('c','/api/moderation/reports')).json()).reports;assert.equal(reports.length,1);assert.equal(reports[0].messageBody,'Ci troviamo in piazza?');
  assert.equal((await req('c','/api/moderation/reports/'+reports[0].id+'/resolve','POST',{resolved:true})).status,200);assert.equal((await (await req('c','/api/moderation/reports')).json()).reports.length,0);
  assert.equal((await req('c','/api/moderation/users/'+users.b.id+'/suspend','POST',{suspended:true})).status,200);assert.equal((await req('b','/api/chat/pair/'+pair.id)).status,403);assert.equal((await req('a','/api/chat/pair/'+pair.id)).status,404);assert.equal((await req('b','/api/account/deletion-method')).status,200);
 }finally{await mf.dispose();}
});
test('bundled Worker preserves the last group seat and keeps applicant chat private',async()=>{
 const {mf,store}=await harness({GROUPS_ENABLED:'true',COMMUNITY_ENABLED:'true'});try{
  const users={};for(const id of ['a','b','c']){users[id]=await store.upsertIdentity('google','group-'+id,id+'@example.com',id);await store.saveProfile(users[id].id,{adult:true,name:id,city:'Bologna',interests:[]});await store.putSession(createHash('sha256').update(id.repeat(43)).digest('base64url'),users[id].id);}
  const req=(who,path,method='GET',body)=>mf.dispatchFetch('https://balotta.example'+path,{method,headers:{authorization:'Bearer '+who.repeat(43),'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const result=await req('a','/api/groups','POST',{title:'Passeggiata locale',description:'Prova sintetica dei gruppi',city:'Bologna',category:'All’aperto',startsAt:new Date(Date.now()+86400000).toISOString(),place:'Parco pubblico',cost:'Gratuito',capacity:2,publicPlace:true});assert.equal(result.status,201);const {group}=await result.json(),path='/api/groups/'+group.id;
  for(const id of ['b','c']){assert.ok((await req(id,path+'/request','POST',{note:'Posso unirmi?'})).status<300);assert.equal((await req(id,'/api/chat/group/'+group.id)).status,404);}
  const results=await Promise.all(['b','c'].map(id=>req('a',path+'/approve','POST',{userId:users[id].id})));assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);const winner=results[0].status===200?'b':'c',loser=winner==='b'?'c':'b';assert.equal((await req(winner,'/api/chat/group/'+group.id)).status,200);assert.equal((await req(loser,'/api/chat/group/'+group.id)).status,404);
  assert.ok((await req(winner,path+'/leave','POST',{})).status<300);assert.ok((await req('a',path+'/approve','POST',{userId:users[loser].id})).status<300);assert.equal((await req('a',path+'/cancel','POST',{})).status,200);assert.equal((await req(loser,'/api/chat/group/'+group.id)).status,404);
 }finally{await mf.dispose();}
});
