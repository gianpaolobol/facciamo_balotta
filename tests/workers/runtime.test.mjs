import test from 'node:test';import assert from 'node:assert/strict';import {readFile,writeFile,readdir} from 'node:fs/promises';import {resolve} from 'node:path';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';import {createD1Store} from '../../server/d1-store.mjs';import {createHash,generateKeyPairSync,sign} from 'node:crypto';
const directory=resolve(process.env.WORKER_BUNDLE_DIR||'.worker-test-bundle');
async function harness(vars={}){
 const wrapper=resolve(directory,'test-wrapper.mjs');await writeFile(wrapper,`import worker from './index.js';export default {fetch(request,env){globalThis.fetch=async url=>{if(String(url)==='https://appleid.apple.com/auth/keys'&&env.TEST_APPLE_JWK)return Response.json({keys:[JSON.parse(env.TEST_APPLE_JWK)]});throw Error('External requests prohibited in local runtime tests');};return worker.fetch(request,{...env,AI:{async run(model,input){if(!model.endsWith('flux-2-klein-4b')||!input.multipart?.contentType.includes('boundary='))throw Error('Invalid binding invocation');return {image:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jw1sAAAAASUVORK5CYII='}}}})}};`);
 const modules=await Promise.all((await readdir(directory)).filter(name=>name==='index.js'||name==='test-wrapper.mjs'||name.endsWith('.jpg')).sort((a,b)=>a==='test-wrapper.mjs'?-1:b==='test-wrapper.mjs'?1:0).map(async name=>({type:name.endsWith('.jpg')?'Data':'ESModule',path:resolve(directory,name),contents:name.endsWith('.jpg')?new Uint8Array(await readFile(resolve(directory,name))):await readFile(resolve(directory,name),'utf8')})));
 const mf=new Miniflare(convertV4MiniflareOptions({modules,modulesRoot:directory,compatibilityDate:'2026-11-07',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'runtime'},bindings:{PUBLIC_ORIGIN:'https://balotta.example',CLOUDFLARE_FREE_PLAN_CONFIRMED:'false',...vars}}));
 const db=await mf.getD1Database('DB'),sql=await readFile(new URL('../../migrations/0001_backend.sql',import.meta.url),'utf8');await db.batch(sql.trim().split(/;\s*(?=(?:CREATE|INSERT|PRAGMA)\b)/i).map(s=>db.prepare(s)));return {mf,store:createD1Store(db)};
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
  const body=JSON.stringify({attempt,verifier,identityToken}),result=await mf.dispatchFetch('https://balotta.example/auth/apple/native/exchange',{method:'POST',body});assert.equal(result.status,200);const {token}=await result.json();
  const current=await mf.dispatchFetch('https://balotta.example/api/session',{headers:{authorization:'Bearer '+token}});assert.equal((await current.json()).user.email,'tester@example.com');
  assert.equal((await mf.dispatchFetch('https://balotta.example/auth/apple/native/exchange',{method:'POST',body})).status,400);
 }finally{await mf.dispose();}
});
