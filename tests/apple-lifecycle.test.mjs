import test from 'node:test';import assert from 'node:assert/strict';import {createHash,verify} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {createApp} from '../server/auth.mjs';import {createStore} from '../server/store.mjs';import {appleFixture,appleIdentity,appleJWT} from './support/apple-fixture.mjs';
const origin='https://balotta.example',sha=s=>createHash('sha256').update(s).digest('base64url'),verifier='v'.repeat(64);
function harness(options={}){
 const store=createStore(options.databasePath||':memory:'),owner=store.upsertIdentity('apple','apple-owner','tester@example.com',''),other=store.upsertIdentity('google','google-owner','tester@example.com','Other');store.putSession(sha('s'.repeat(43)),owner.id);store.putSession(sha('g'.repeat(43)),other.id);let nonce,revoked=false;
 const app=createApp({store,config:{origin,enabled:true,appleNativeEnabled:true,appleBundleId:'it.facciamobalotta.app',appleNotificationsEnabled:true,appleTeamId:'TEAM123456',appleKeyId:'KEY1234567',applePrivateKey:appleFixture.privatePem,allowedEmails:['tester@example.com'],...options.config},providerFetch:async(url,init)=>{
  if(String(url).endsWith('/auth/keys'))return Response.json({keys:[appleFixture.jwk]});
  const params=new URLSearchParams(init.body),secret=params.get('client_secret'),[head,body,sig]=secret.split('.'),claims=JSON.parse(Buffer.from(body,'base64url').toString());assert.equal(JSON.parse(Buffer.from(head,'base64url').toString()).alg,'ES256');assert.equal(claims.iss,'TEAM123456');assert.equal(claims.sub,'it.facciamobalotta.app');assert.equal(claims.exp-claims.iat,600);assert.equal(verify('sha256',Buffer.from(head+'.'+body),{key:appleFixture.clientPublicKey,dsaEncoding:'ieee-p1363'},Buffer.from(sig,'base64url')),true);
  if(String(url)==='https://appleid.apple.com/auth/token'){assert.equal(params.get('code'),'fresh-code');return options.tokenError?new Response('private failure',{status:400}):Response.json({id_token:appleIdentity(nonce,options.tokenClaims),refresh_token:'synthetic-refresh',access_token:'synthetic-access',token_type:'Bearer',expires_in:3600});}
  assert.equal(String(url),'https://appleid.apple.com/auth/revoke');assert.equal(params.get('token'),'synthetic-refresh');assert.equal(params.get('token_type_hint'),'refresh_token');if(options.revokeError)return new Response('private failure',{status:503});revoked=true;return new Response(null,{status:200});
 }});
 const req=(path,method='GET',body,session='s'.repeat(43))=>app(new Request(origin+path,{method,headers:{authorization:'Bearer '+session,'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})}));
 const start=async()=>{const r=await req('/api/account/apple/start','POST',{challenge:sha(verifier)});assert.equal(r.status,200);const result=await r.json();nonce=result.nonce;return result;};
 const finish=(a,claims={},proof=verifier)=>req('/api/account/apple/delete','POST',{attempt:a.attempt,verifier:proof,identityToken:appleIdentity(a.nonce,claims),authorizationCode:'fresh-code'});
 const notify=(type='consent-revoked',id='event-one',overrides={})=>req('/auth/apple/notifications','POST',{payload:appleJWT({jti:id,events:{type,sub:'apple-owner',event_time:Math.floor(Date.now()/1000)},...overrides})});
 return {store,owner,other,req,start,finish,notify,revoked:()=>revoked};
}
test('Apple account deletion requires fresh confirmation and revokes before deleting local data',async()=>{
 const h=harness();try{
  assert.equal((await h.req('/api/account','DELETE')).status,409);assert.equal((await (await h.req('/api/account/deletion-method')).json()).provider,'apple');
  h.store.saveProfile(h.owner.id,{name:'Owner'});const attempt=await h.start(),result=await h.finish(attempt);assert.equal(result.status,200);assert.equal(h.revoked(),true);assert.equal(h.store.getProfile(h.owner.id),null);assert.equal((await h.req('/api/session')).status,401);assert.equal((await h.req('/api/session','GET',undefined,'g'.repeat(43))).status,200);
 }finally{h.store.close();}
});
test('Apple deletion rejects wrong subject, verifier and replay without revoking another account',async()=>{
 const h=harness();try{let a=await h.start();assert.equal((await h.finish(a,{sub:'another-person'})).status,401);assert.equal(h.revoked(),false);assert.equal((await h.finish(a)).status,400);a=await h.start();assert.equal((await h.finish(a,{},'x'.repeat(64))).status,400);assert.equal((await h.req('/api/session')).status,200);}finally{h.store.close();}
});
test('failed token validation, wrong returned identity and failed revocation preserve the local account',async()=>{
 for(const options of [{tokenError:true},{revokeError:true},{tokenClaims:{sub:'another-person'}},{tokenClaims:{nonce:'wrong'}}]){const h=harness(options);try{const a=await h.start(),r=await h.finish(a);assert.ok(r.status>=400);assert.doesNotMatch(await r.text(),/synthetic-refresh|private failure/);assert.equal((await h.req('/api/session')).status,200);}finally{h.store.close();}}
});
test('missing Apple revocation configuration fails closed while other providers can delete normally',async()=>{
 const h=harness({config:{applePrivateKey:''}});try{assert.equal((await h.req('/api/account/apple/start','POST',{challenge:sha(verifier)})).status,503);assert.equal((await h.req('/api/account','DELETE',undefined,'g'.repeat(43))).status,200);assert.equal((await h.req('/api/session')).status,200);}finally{h.store.close();}
});
test('signed consent revocation invalidates all Apple sessions and handoffs but preserves other providers',async()=>{
 const h=harness();try{h.store.putHandoff('pending',h.owner.id,'challenge');assert.equal((await h.notify()).status,200);assert.equal((await h.req('/api/session')).status,401);assert.equal(h.store.takeHandoff('pending'),null);assert.equal((await h.req('/api/session','GET',undefined,'g'.repeat(43))).status,200);
  assert.equal(await h.store.putAppleSession('old-token',h.owner.id,Math.floor(Date.now()/1000)-1),false);
 }finally{h.store.close();}
});
test('duplicate Apple notification does not invalidate a newly authorized session',async()=>{
 const h=harness();try{assert.equal((await h.notify()).status,200);assert.equal(await h.store.putAppleSession(sha('n'.repeat(43)),h.owner.id,Math.floor(Date.now()/1000)+1),true);assert.equal((await h.notify()).status,200);assert.equal((await h.req('/api/session','GET',undefined,'n'.repeat(43))).status,200);}finally{h.store.close();}
});
test('Apple account-deleted removes private data while email forwarding events do not revoke access',async()=>{
 const h=harness();try{h.store.saveProfile(h.owner.id,{name:'Owner'});assert.equal((await h.notify('email-disabled','mail')).status,200);assert.equal((await h.req('/api/session')).status,200);assert.equal((await h.notify('account-deleted','deleted')).status,200);assert.equal(h.store.getProfile(h.owner.id),null);assert.equal((await h.req('/api/session')).status,401);}finally{h.store.close();}
});
test('Apple notifications reject wrong audience, stale events, invalid signature and disabled endpoint',async()=>{
 const h=harness();try{for(const claims of [{aud:'wrong.bundle'},{iat:Math.floor(Date.now()/1000)-604801},{jti:''},{events:{type:'consent-revoked',sub:'apple-owner',event_time:'invalid'}}])assert.equal((await h.notify('consent-revoked','bad',claims)).status,401);assert.equal((await h.req('/auth/apple/notifications','POST',{payload:'invalid'})).status,401);assert.equal((await h.req('/api/session')).status,200);}finally{h.store.close();}
 const disabled=harness({config:{appleNotificationsEnabled:false}});try{assert.equal((await disabled.notify()).status,503);}finally{disabled.store.close();}
});
test('Apple events accept JSON event strings and millisecond timestamps',async()=>{
 const h=harness();try{
  const now=Date.now(),payload=appleJWT({jti:'string-event',events:JSON.stringify({type:'consent-revoked',sub:'apple-owner',event_time:now})});assert.equal((await h.req('/auth/apple/notifications','POST',{payload})).status,200);assert.equal((await h.req('/api/session')).status,401);
 }finally{h.store.close();}
});
test('pending Apple login cannot recreate personal identity after successful local deletion',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'balotta-apple-')),path=join(directory,'test.sqlite'),h=harness({databasePath:path});let db;
 try{
  const begin=await h.req('/auth/apple/native/start','POST',{challenge:sha(verifier)}),pending=await begin.json(),jwt=appleIdentity(pending.nonce,{iat:Math.floor(Date.now()/1000)+30});
  assert.equal((await h.finish(await h.start())).status,200);
  const r=await h.req('/auth/apple/native/exchange','POST',{attempt:pending.attempt,verifier,identityToken:jwt});assert.equal(r.status,401);
  db=new DatabaseSync(path,{readOnly:true});assert.equal(db.prepare("SELECT count(*) AS n FROM users WHERE provider='apple' AND subject='apple-owner'").get().n,0);
 }finally{db?.close();h.store.close();rmSync(directory,{recursive:true,force:true});}
});
test('pending Apple login cannot recreate personal identity after an account-deleted notification',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'balotta-apple-')),path=join(directory,'test.sqlite'),h=harness({databasePath:path});let db;
 try{
  const pending=await (await h.req('/auth/apple/native/start','POST',{challenge:sha(verifier)})).json(),jwt=appleIdentity(pending.nonce,{iat:Math.floor(Date.now()/1000)+30});assert.equal((await h.notify('account-deleted')).status,200);
  assert.equal((await h.req('/auth/apple/native/exchange','POST',{attempt:pending.attempt,verifier,identityToken:jwt})).status,401);
  db=new DatabaseSync(path,{readOnly:true});assert.equal(db.prepare("SELECT count(*) AS n FROM users WHERE provider='apple' AND subject='apple-owner'").get().n,0);
 }finally{db?.close();h.store.close();rmSync(directory,{recursive:true,force:true});}
});
test('first delayed and reordered revocation events preserve a newer Apple authorization',async()=>{
 const h=harness();try{
  const now=Math.floor(Date.now()/1000),event={id:'earlier',subject:'apple-owner',type:'consent-revoked',eventTime:(now-20)*1000,expires:Date.now()+691200000};
  assert.equal(await h.store.putAppleSession('newer',h.owner.id,now-10),true);await h.store.applyAppleEvent(event);assert.ok(h.store.getSession('newer'));
  await h.store.applyAppleEvent({...event,id:'even-earlier',eventTime:(now-30)*1000});assert.ok(h.store.getSession('newer'));
 }finally{h.store.close();}
});
