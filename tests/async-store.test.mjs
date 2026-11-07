import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {createApp} from '../server/auth.mjs';import {createStore} from '../server/store.mjs';
test('API awaits an asynchronous store for native sessions and profile persistence',async()=>{
 const local=createStore(':memory:');try{const user=local.upsertIdentity('google','a','a@example.com','Ada'),token='a'.repeat(43);local.putSession(createHash('sha256').update(token).digest('base64url'),user.id);
 const store=new Proxy(local,{get(target,key){return typeof target[key]==='function'?async(...args)=>target[key](...args):target[key];}});
 const app=createApp({store,config:{origin:'https://balotta.example'}});const headers={authorization:'Bearer '+token,'content-type':'application/json'};
 const response=await app(new Request('https://balotta.example/api/session',{headers}));assert.equal(response.status,200);assert.equal((await response.json()).user.id,user.id);
 const save=await app(new Request('https://balotta.example/api/profile',{method:'PUT',headers,body:JSON.stringify({name:'Ada',adult:true,city:'Bologna',interests:['Musica']})}));assert.equal(save.status,200);
 const read=await app(new Request('https://balotta.example/api/profile',{headers}));assert.equal((await read.json()).profile.name,'Ada');
 }finally{local.close();}
});
