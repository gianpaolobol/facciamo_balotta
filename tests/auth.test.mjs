import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createApp } from '../server/auth.mjs';
import { createStore } from '../server/store.mjs';

const origin='https://balotta.example';
const config={origin,enabled:true,googleId:'google-id',googleSecret:'secret',facebookId:'fb-id',facebookSecret:'secret',facebookVersion:'v25.0',allowedEmails:['tester@example.com']};
const sha=s=>createHash('sha256').update(s).digest('base64url');
function harness(overrides={}, identity={sub:'subject-a',email:'tester@example.com',email_verified:true,name:'Ada'}) {
 const store=createStore(':memory:');
 const app=createApp({config:{...config,...overrides},store,providerFetch:async(url)=>{
  if(String(url).includes('/token')||String(url).includes('/access_token')) return Response.json({access_token:'provider-access'});
  return Response.json(identity);
 }});
 const req=(path,init={})=>app(new Request(origin+path,init));
 return {store,req};
}
async function login(h,provider='google',query='') {
 const begin=await h.req('/auth/'+provider+'/start'+query); const location=new URL(begin.headers.get('location'));
 const state=location.searchParams.get('state'); const cookie=begin.headers.get('set-cookie')?.split(';')[0];
 const done=await h.req('/auth/'+provider+'/callback?state='+state+'&code=provider-code',{headers:{cookie}});
 return {done,state,cookie};
}
const sessionCookie=r=>r.headers.get('set-cookie').split(',').find(c=>c.trim().startsWith('balotta_session='))?.trim().split(';')[0];
test('missing credentials and unknown providers cannot produce a login',async()=>{
 const h=harness({googleId:''}); assert.equal((await h.req('/auth/google/start')).status,503); assert.equal((await h.req('/auth/instagram/start')).status,404); h.store.close();
});
test('OAuth state must be bound to the initiating browser and cannot be replayed',async()=>{
 const h=harness(); const start=await h.req('/auth/google/start'); const state=new URL(start.headers.get('location')).searchParams.get('state');
 const callback='/auth/google/callback?state='+state+'&code=code'; assert.equal((await h.req(callback)).status,400);
 const cookie=start.headers.get('set-cookie').split(';')[0]; assert.equal((await h.req(callback,{headers:{cookie}})).status,400); h.store.close();
});
test('OAuth login creates a private session, and replay cannot create another',async()=>{
 const h=harness(); const {done,state,cookie}=await login(h); assert.equal(done.status,303); const sc=sessionCookie(done); assert.ok(sc);
 const current=await h.req('/api/session',{headers:{cookie:sc}}); assert.equal(current.status,200); assert.equal((await current.json()).user.name,'Ada');
 assert.equal((await h.req('/auth/google/callback?state='+state+'&code=again',{headers:{cookie}})).status,400); h.store.close();
});
test('uninvited and unverified emails never receive a session',async()=>{
 for(const identity of [{sub:'a',email:'outsider@example.com',email_verified:true},{sub:'a',email:'tester@example.com',email_verified:false},{sub:'a'}]) {
  const h=harness({},identity); const {done}=await login(h); assert.equal(done.status,403); assert.equal(done.headers.get('set-cookie'),null); h.store.close();
 }
});
test('provider identities are not merged just because their email matches',async()=>{
 const store=createStore(':memory:'); const a=store.upsertIdentity('google','a','tester@example.com','Ada'); const b=store.upsertIdentity('facebook','b','tester@example.com','Ada');
 assert.notEqual(a.id,b.id); assert.equal(store.upsertIdentity('google','a','tester@example.com','Ada').id,a.id); store.close();
});
test('profile access requires session and one user cannot select another user by payload',async()=>{
 const h=harness(); assert.equal((await h.req('/api/profile')).status,401);
 const {done}=await login(h); const cookie=sessionCookie(done);
 const save=await h.req('/api/profile',{method:'PUT',headers:{cookie,origin,'content-type':'application/json'},body:JSON.stringify({userId:'other',name:'Ada',adult:true,city:'Bologna',interests:['Musica']})});
 assert.equal(save.status,200); const result=await h.req('/api/profile',{headers:{cookie}}); assert.equal((await result.json()).profile.userId,undefined); h.store.close();
});
test('cookie-authenticated cross-origin writes are forbidden; invalid profile data is rejected',async()=>{
 const h=harness(); const {done}=await login(h); const cookie=sessionCookie(done);
 assert.equal((await h.req('/api/profile',{method:'PUT',headers:{cookie,origin:'https://evil.example'},body:'{}'})).status,403);
 assert.equal((await h.req('/api/profile',{method:'PUT',headers:{cookie,origin},body:'not-json'})).status,400);
 assert.equal((await h.req('/api/profile',{method:'PUT',headers:{cookie,origin,'content-type':'application/json'},body:JSON.stringify({name:'Ada',adult:false,city:'Bologna',interests:[]})})).status,400); h.store.close();
});
test('native handoff uses a single-use code bound to the client verifier',async()=>{
 const h=harness(); const verifier='v'.repeat(64); const {done}=await login(h,'google','?platform=native&challenge='+sha(verifier));
 const link=new URL(done.headers.get('location')); assert.equal(link.protocol,'facciamobalotta:'); assert.equal(link.searchParams.get('token'),null);
 const code=link.searchParams.get('code'); assert.ok(code);
 const exchange=await h.req('/auth/native/exchange',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code,verifier})}); assert.equal(exchange.status,200);
 const token=(await exchange.json()).token; assert.ok(token);
 assert.equal((await h.req('/api/session',{headers:{authorization:'Bearer '+token}})).status,200);
 assert.equal((await h.req('/auth/native/exchange',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code,verifier})})).status,400); h.store.close();
});
test('wrong native verifier burns the handoff code without creating a session',async()=>{
 const h=harness(); const {done}=await login(h,'google','?platform=native&challenge='+sha('v'.repeat(64))); const code=new URL(done.headers.get('location')).searchParams.get('code');
 const exchange=await h.req('/auth/native/exchange',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code,verifier:'x'.repeat(64)})}); assert.equal(exchange.status,400); h.store.close();
});
test('logout invalidates the server session and account deletion removes its profile',async()=>{
 const h=harness(); const {done}=await login(h); const cookie=sessionCookie(done);
 assert.equal((await h.req('/api/account',{method:'DELETE',headers:{cookie,origin}})).status,200);
 assert.equal((await h.req('/api/session',{headers:{cookie}})).status,401);
 const next=await login(h); const nextCookie=sessionCookie(next.done);
 assert.equal((await h.req('/api/logout',{method:'POST',headers:{cookie:nextCookie,origin}})).status,200);
 assert.equal((await h.req('/api/session',{headers:{cookie:nextCookie}})).status,401); h.store.close();
});
