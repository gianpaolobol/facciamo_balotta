import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {createStore} from '../server/store.mjs';import {createApp} from '../server/auth.mjs';
import {DatabaseSync} from 'node:sqlite';
test('peer illustrations require membership and explicit sharing, and expose approved images only',async()=>{
 const store=createStore(':memory:'),users={};try{
  for(const id of ['a','b','c']){users[id]=store.upsertIdentity('google',id,id+'@example.com',id);store.saveProfile(users[id].id,{adult:true,name:id,city:'Bologna',interests:['Musica']});store.putSession(createHash('sha256').update(id.repeat(43)).digest('base64url'),users[id].id);}
  const pair=await store.meetings.offerPair(users.a.id,users.b.id),app=createApp({store,config:{origin:'https://balotta.example',meetingsEnabled:true,matchingEnabled:true}}),path='/api/pairings/'+pair.id+'/illustrations/portrait',req=id=>app(new Request('https://balotta.example'+path,{headers:{authorization:'Bearer '+id.repeat(43)}}));
  const image={bytes:Buffer.from('approved-fixture'),mime:'image/png',model:'fixture',styleVersion:'fixture'};store.saveProfileImage(users.b.id,'portrait','private-description-hash',image,'preview');
  let response=await req('a');assert.equal(response.status,200);assert.equal((await response.json()).image,null);
  await store.matching.save(users.b.id,{enabled:true,accepted:true,intent:'friendship',scope:'province',availability:['weekend_day'],policyVersion:'2026-11-07'});
  assert.equal((await (await req('a')).json()).image,null);store.approveProfileImage(users.b.id,'portrait','preview');
  response=await req('a');const data=await response.json();assert.equal(response.status,200);assert.match(data.image.dataUri,/^data:image\/png;base64,/);assert.doesNotMatch(JSON.stringify(data),/description|@example.com/);assert.equal((await req('c')).status,404);
  await store.community.block(users.b.id,users.a.id);assert.equal((await req('a')).status,404);
 }finally{store.close();}
});
test('sharing consent revoked before the image snapshot never exposes approved bytes from a mutual connection',async()=>{
 const store=createStore(':memory:'),prepare=DatabaseSync.prototype.prepare;let changed=false;
 try{
  const a=store.upsertIdentity('google','a','a@example.com','A'),b=store.upsertIdentity('google','b','b@example.com','B');for(const u of [a,b]){store.saveProfile(u.id,{adult:true,name:u.name,city:'Bologna',interests:['Musica']});await store.matching.save(u.id,{enabled:true,accepted:true,policyVersion:'2026-11-07',scope:'province',intent:'friendship',availability:['weekend_day']});}
  const pair=await store.meetings.offerPair(a.id,b.id);await store.meetings.decide(a.id,pair.id,'yes');await store.meetings.decide(b.id,pair.id,'yes');store.putSession(createHash('sha256').update('a'.repeat(43)).digest('base64url'),a.id);store.saveProfileImage(b.id,'portrait','hash',{bytes:Buffer.from('private'),mime:'image/png',model:'fixture',styleVersion:'fixture'},'approved');store.approveProfileImage(b.id,'portrait','approved');
  DatabaseSync.prototype.prepare=function(sql){if(!changed&&sql.includes('FROM profile_images')){changed=true;prepare.call(this,'UPDATE matching_preferences SET enabled=0 WHERE user_id=?').run(b.id);}return prepare.call(this,sql);};
  const app=createApp({store,config:{origin:'https://balotta.example',meetingsEnabled:true,matchingEnabled:true}}),r=await app(new Request('https://balotta.example/api/pairings/'+pair.id+'/illustrations/portrait',{headers:{authorization:'Bearer '+'a'.repeat(43)}}));assert.equal(r.status,200);assert.equal((await r.json()).image,null);assert.equal(changed,true);
 }finally{DatabaseSync.prototype.prepare=prepare;store.close();}
});
