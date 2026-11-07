import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../server/auth.mjs';
import {createStore} from '../server/store.mjs';
const origin='https://balotta.example';
const path='/api/illustrated-profile';
const empty=()=>({fields:{portrait:'',...Object.fromEntries([1,2,3,4,5].map(i=>[`interest-${i}`,'']))},confirmed:{}});
function harness(db=':memory:'){
 const store=createStore(db);const app=createApp({store,config:{origin}});
 const users=['a','b'].map((id,i)=>{const user=store.upsertIdentity('google',id,id+'@example.com',id);const token=(i?'b':'a').repeat(43);store.putSession(createHash('sha256').update(token).digest('base64url'),user.id);return {...user,token};});
 function req(method='GET',body,who=0,headers={}){return app(new Request(origin+path,{method,headers:{cookie:'balotta_session='+users[who].token,origin,'content-type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}));}
 return {store,users,app,req};
}
test('private illustrated drafts require a valid session and use the session owner',async()=>{
 const h=harness();try{
 assert.equal((await h.app(new Request(origin+path))).status,401);
 assert.deepEqual(await (await h.req()).json(),{draft:null,version:0});
 const draft=empty();draft.fields.portrait='Capelli corti';draft.confirmed.portrait='Capelli corti';
 assert.equal((await h.req('PUT',{draft,version:0,userId:h.users[1].id})).status,200);
 assert.deepEqual((await (await h.req()).json()).draft,draft);
 assert.deepEqual(await (await h.req('GET',undefined,1)).json(),{draft:null,version:0});
 }finally{h.store.close();}
});
test('saving and reopening SQLite preserves texts and confirmations independently of the base profile',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'balotta-draft-'));const db=join(dir,'test.sqlite');let h=harness(db);
 try{
 const draft=empty();draft.fields['interest-4']='Cucina emiliana';draft.confirmed['interest-4']='Cucina emiliana';
 h.store.saveProfile(h.users[0].id,{name:'Ada',adult:true,city:'Bologna',interests:[]});
 assert.equal((await h.req('PUT',{draft,version:0})).status,200);const id=h.users[0].id;h.store.close();h=null;
 const reopened=createStore(db);try{assert.deepEqual(reopened.getIllustratedProfile(id),{draft,version:1});assert.equal(reopened.getProfile(id).name,'Ada');}finally{reopened.close();}
 }finally{h?.store.close();rmSync(dir,{recursive:true,force:true});}
});
test('stale saves conflict instead of overwriting newer descriptions',async()=>{
 const h=harness();try{const draft=empty();assert.equal((await h.req('PUT',{draft,version:0})).status,200);
 draft.fields.portrait='Nuova descrizione';assert.equal((await h.req('PUT',{draft,version:1})).status,200);
 assert.equal((await h.req('PUT',{draft:empty(),version:1})).status,409);
 assert.equal((await h.req('PUT',{draft:empty(),version:0})).status,409);
 const current=await (await h.req()).json();assert.equal(current.version,2);assert.equal(current.draft.fields.portrait,'Nuova descrizione');
 }finally{h.store.close();}
});
test('draft API rejects malformed fields, extra slots, forged confirmations and invalid versions',async()=>{
 const h=harness();try{
 const invalid=[{draft:empty(),version:-1},{draft:empty(),version:1.5},{draft:empty(),version:'0'},{draft:null,version:0}];
 for(const field of [null,42,'a'.repeat(1001)]){const draft=empty();draft.fields.portrait=field;invalid.push({draft,version:0});}
 const extra=empty();extra.fields['interest-6']='Sport';invalid.push({draft:extra,version:0});
 const forged=empty();forged.fields.portrait='A';forged.confirmed.portrait='B';invalid.push({draft:forged,version:0});
 const blank=empty();blank.confirmed.portrait='';invalid.push({draft:blank,version:0});
 for(const body of invalid)assert.equal((await h.req('PUT',body)).status,400,JSON.stringify(body));
 assert.equal((await h.req('PUT',{draft:empty(),version:2})).status,409);
 assert.deepEqual(await (await h.req()).json(),{draft:null,version:0});
 }finally{h.store.close();}
});
test('draft writes retain origin protection and accept a native bearer session',async()=>{
 const h=harness();try{
 assert.equal((await h.req('PUT',{draft:empty(),version:0},0,{origin:'https://elsewhere.example'})).status,403);
 assert.equal((await h.req('PUT',{draft:empty(),version:0},0,{cookie:'',origin:'',authorization:'Bearer '+h.users[0].token})).status,200);
 }finally{h.store.close();}
});
test('account deletion cascades to illustrated drafts and invalidates the session',async()=>{
 const h=harness();try{
 assert.equal((await h.req('PUT',{draft:empty(),version:0})).status,200);
 const response=await h.app(new Request(origin+'/api/account',{method:'DELETE',headers:{cookie:'balotta_session='+h.users[0].token,origin}}));
 assert.equal(response.status,200);assert.deepEqual(h.store.getIllustratedProfile(h.users[0].id),{draft:null,version:0});assert.equal((await h.req()).status,401);
 }finally{h.store.close();}
});
test('six maximum-length confirmed descriptions round-trip even with JSON-escaped characters',async()=>{
 const h=harness();try{const draft=empty();for(const [index,id] of Object.keys(draft.fields).entries()){const text='\u0000'.repeat(999)+index;draft.fields[id]=text;draft.confirmed[id]=text;}
 assert.ok(JSON.stringify({draft,version:0}).length>16384);assert.equal((await h.req('PUT',{draft,version:0})).status,200);assert.deepEqual((await (await h.req()).json()).draft,draft);
 }finally{h.store.close();}
});
test('duplicate confirmed interests are rejected after case and Unicode normalization',async()=>{
 const h=harness();try{for(const text of ['musica','Ｍｕｓｉｃａ']){const draft=empty();draft.fields['interest-1']='Musica';draft.fields['interest-2']=text;draft.confirmed={'interest-1':'Musica','interest-2':text};assert.equal((await h.req('PUT',{draft,version:0})).status,400);}
 const partial=empty();partial.fields['interest-1']='Musica';partial.fields['interest-2']='musica';partial.confirmed={'interest-1':'Musica'};assert.equal((await h.req('PUT',{draft:partial,version:0})).status,200);
 }finally{h.store.close();}
});
