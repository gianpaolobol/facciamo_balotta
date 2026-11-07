import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {createApp} from '../server/auth.mjs';
import {createStore} from '../server/store.mjs';

const origin='https://balotta.example',bundle='it.facciamobalotta.app';
const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'test-key',alg:'RS256',use:'sig'};
const sha=s=>createHash('sha256').update(s).digest('base64url');
const verifier='v'.repeat(64);
function token(nonce,claims={},header={}){
 const now=Math.floor(Date.now()/1000);
 const head=Buffer.from(JSON.stringify({alg:'RS256',kid:'test-key',...header})).toString('base64url');
 const body=Buffer.from(JSON.stringify({iss:'https://appleid.apple.com',aud:bundle,iat:now,exp:now+600,sub:'apple-subject',nonce,email:'tester@example.com',email_verified:'true',...claims})).toString('base64url');
 const input=head+'.'+body;return input+'.'+sign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url');
}
function harness(config={},fetchKeys){
 const store=createStore(':memory:');
 const app=createApp({store,config:{origin,enabled:true,appleNativeEnabled:true,appleBundleId:bundle,allowedEmails:['tester@example.com'],...config},providerFetch:fetchKeys||(async(url)=>{assert.equal(String(url),'https://appleid.apple.com/auth/keys');return Response.json({keys:[jwk]});})});
 const req=(path,body)=>app(new Request(origin+path,body===undefined?{}:{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}));
 const start=async()=>{const r=await req('/auth/apple/native/start',{challenge:sha(verifier)});assert.equal(r.status,200);return r.json();};
 const exchange=(attempt,identityToken=token(attempt.nonce),proof=verifier)=>req('/auth/apple/native/exchange',{attempt:attempt.attempt,verifier:proof,identityToken,email:'spoof@example.com',name:'Untrusted'});
 return {store,req,start,exchange,app};
}
test('Apple login is advertised only with explicit native configuration',async()=>{
 for(const config of [{enabled:false},{appleNativeEnabled:false},{appleBundleId:'other.bundle'}]){
  const h=harness(config);try{assert.equal((await (await h.req('/api/config')).json()).providers.apple,false);assert.equal((await h.req('/auth/apple/native/start',{challenge:sha(verifier)})).status,503);}finally{h.store.close();}
 }
 const h=harness();try{assert.equal((await (await h.req('/api/config')).json()).providers.apple,true);}finally{h.store.close();}
});
test('signed Apple token creates a native session once, with no client-supplied identity',async()=>{
 const h=harness();try{
  const a=await h.start(),r=await h.exchange(a);assert.equal(r.status,200);const {token:session}=await r.json();assert.match(session,/^[A-Za-z0-9_-]{43}$/);
  const current=await h.app(new Request(origin+'/api/session',{headers:{authorization:'Bearer '+session}}));const {user}=await current.json();assert.equal(user.email,'tester@example.com');assert.equal(user.name,'');
  assert.equal((await h.exchange(a)).status,400);
 }finally{h.store.close();}
});
test('concurrent Apple exchanges mint only one session',async()=>{
 const h=harness();try{const a=await h.start(),jwt=token(a.nonce);const rs=await Promise.all([h.exchange(a,jwt),h.exchange(a,jwt)]);assert.deepEqual(rs.map(r=>r.status).sort(),[200,400]);}finally{h.store.close();}
});
test('wrong verifier consumes the Apple attempt without a session',async()=>{
 const h=harness();try{const a=await h.start();assert.equal((await h.exchange(a,token(a.nonce),'x'.repeat(64))).status,400);assert.equal((await h.exchange(a)).status,400);}finally{h.store.close();}
});
test('invalid Apple claims cannot authenticate despite a real RSA signature',async()=>{
 const now=Math.floor(Date.now()/1000);
 for(const claims of [{iss:'https://evil.example'},{aud:'other.bundle'},{aud:[bundle,'other']},{exp:now-1},{iat:now+300},{exp:'9999999999'},{nonce:'wrong'},{sub:''},{email_verified:false},{email:'outsider@example.com'},{email:''}]){
  const h=harness();try{const a=await h.start();assert.equal((await h.exchange(a,token(a.nonce,claims))).status,401,JSON.stringify(claims));}finally{h.store.close();}
 }
});
test('invalid Apple signatures, algorithms, key ids and malformed tokens are rejected',async()=>{
 const h=harness();try{for(const make of [a=>token(a.nonce,{}, {alg:'none'}),a=>token(a.nonce,{}, {kid:'unknown'}),a=>token(a.nonce).slice(0,-20)+'a'.repeat(20),()=> 'not.a.jwt',()=> 'a'.repeat(9000)]){const a=await h.start();assert.equal((await h.exchange(a,make(a))).status,401);}}finally{h.store.close();}
});
test('unverified email cannot enter beta even if the client supplies an invited address',async()=>{
 const h=harness();try{const a=await h.start();assert.equal((await h.exchange(a,token(a.nonce,{email_verified:'false'}))).status,401);}finally{h.store.close();}
});
test('Apple key service failures do not expose details or create a session',async()=>{
 const h=harness({},async()=>new Response('private diagnostics',{status:503}));try{const a=await h.start(),r=await h.exchange(a);assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/private diagnostics|test-key/);}finally{h.store.close();}
});
test('invalid challenge cannot allocate an Apple login attempt',async()=>{
 const h=harness();try{assert.equal((await h.req('/auth/apple/native/start',{challenge:'short'})).status,400);}finally{h.store.close();}
});
test('Apple request expires after five minutes even with a valid identity token',async()=>{
 const h=harness(),take=h.store.takeAttempt;h.store.takeAttempt=key=>{const a=take(key);return a?{...a,created:Date.now()-300001}:a;};
 try{const a=await h.start();assert.equal((await h.exchange(a)).status,400);}finally{h.store.close();}
});
