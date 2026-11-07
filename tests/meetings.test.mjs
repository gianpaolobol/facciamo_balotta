import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {createStore} from '../server/store.mjs';import {createApp} from '../server/auth.mjs';
const origin='https://balotta.example',sha=s=>createHash('sha256').update(s).digest('base64url');
const details=()=>({activity:'Una mostra e due chiacchiere',startsAt:new Date(Date.now()+86400000).toISOString(),place:'Ingresso museo pubblico, Bologna',cost:'Ingresso 8 EUR a persona',publicPlace:true});
function harness(config={}){
 const store=createStore(':memory:'),users={};for(const name of ['a','b','c']){users[name]=store.upsertIdentity('google',name,name+'@example.com',name.toUpperCase());store.saveProfile(users[name].id,{adult:true,name:name.toUpperCase(),city:'Bologna',interests:['Musica']});store.putSession(sha(name.repeat(43)),users[name].id);}
 const app=createApp({store,config:{origin,meetingsEnabled:true,...config}});
 const req=(who,path,method='GET',body)=>app(new Request(origin+path,{method,headers:{authorization:'Bearer '+who.repeat(43),'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})}));
 const offer=async()=>{assert.ok(store.meetings,'persistent meetings store missing');return store.meetings.offerPair(users.a.id,users.b.id);};
 const mutual=async()=>{const pair=await offer();for(const who of ['a','b'])assert.equal((await req(who,'/api/pairings/'+pair.id+'/decision','POST',{decision:'yes'})).status,200);return pair;};
 const appointment=async()=>{const pair=await mutual(),r=await req('a','/api/pairings/'+pair.id+'/appointment','POST',details());assert.equal(r.status,201);return (await r.json()).appointment;};
 return {store,users,req,offer,mutual,appointment};
}
test('meetings are disabled by default and require an authenticated adult',async()=>{
 const h=harness({meetingsEnabled:false});try{assert.equal((await h.req('a','/api/pairings')).status,503);}finally{h.store.close();}
 const live=harness();try{assert.equal((await live.req('x','/api/pairings')).status,401);live.store.saveProfile(live.users.a.id,{adult:false});assert.equal((await live.req('a','/api/pairings')).status,403);}finally{live.store.close();}
});
test('pair candidates are private, disclose no email and cannot be created with arbitrary client user IDs',async()=>{
 const h=harness();try{const p=await h.offer(),r=await h.req('a','/api/pairings'),data=await r.json();assert.equal(data.pairings.length,1);assert.doesNotMatch(JSON.stringify(data),/@example.com/);assert.equal((await h.req('c','/api/pairings/'+p.id)).status,404);assert.equal((await h.req('c','/api/pairings/'+p.id+'/decision','POST',{decision:'yes'})).status,404);assert.equal((await h.req('a','/api/pairings','POST',{peerId:h.users.c.id})).status,405);}finally{h.store.close();}
});
test('appointment needs mutual interest and starts without either confirmation',async()=>{
 const h=harness();try{const p=await h.offer();assert.equal((await h.req('a','/api/pairings/'+p.id+'/appointment','POST',details())).status,409);assert.equal((await h.req('a','/api/pairings/'+p.id+'/decision','POST',{decision:'yes'})).status,200);assert.equal((await h.req('a','/api/pairings/'+p.id+'/appointment','POST',details())).status,409);assert.equal((await h.req('b','/api/pairings/'+p.id+'/decision','POST',{decision:'yes'})).status,200);const created=await h.req('a','/api/pairings/'+p.id+'/appointment','POST',details());assert.equal(created.status,201);const a=(await created.json()).appointment;assert.equal(a.version,1);assert.deepEqual(a.confirmations,[]);assert.equal(a.status,'proposed');assert.equal((await h.req('b','/api/pairings/'+p.id+'/appointment','POST',details())).status,409);}finally{h.store.close();}
});
test('concurrent confirmations combine on the same version and revisions clear both confirmations',async()=>{
 const h=harness();try{const a=await h.appointment(),path='/api/appointments/'+a.id;const rs=await Promise.all(['a','b'].map(who=>h.req(who,path+'/confirm','POST',{version:1})));assert.deepEqual(rs.map(r=>r.status),[200,200]);let current=(await (await h.req('a',path)).json()).appointment;assert.equal(current.status,'confirmed');assert.equal(current.confirmations.length,2);assert.equal((await h.req('b',path,'PATCH',{version:1,changes:{place:'Piazza pubblica, Bologna'}})).status,200);current=(await (await h.req('a',path)).json()).appointment;assert.equal(current.version,2);assert.deepEqual(current.confirmations,[]);assert.equal((await h.req('a',path+'/confirm','POST',{version:1})).status,409);}finally{h.store.close();}
});
test('only one concurrent revision wins and outsiders cannot read or modify appointments',async()=>{
 const h=harness();try{const a=await h.appointment(),path='/api/appointments/'+a.id;const rs=await Promise.all(['a','b'].map(who=>h.req(who,path,'PATCH',{version:1,changes:{cost:'Ingresso gratuito'}})));assert.deepEqual(rs.map(r=>r.status).sort(),[200,409]);for(const [method,suffix,body]of [['GET','',undefined],['PATCH','',{version:2,changes:{place:'Altrove'}}],['POST','/confirm',{version:2}],['POST','/cancel',{version:2}]])assert.equal((await h.req('c',path+suffix,method,body)).status,404);}finally{h.store.close();}
});
test('appointment input cannot change membership or inject confirmations and requires a public future plan',async()=>{
 const h=harness();try{const p=await h.mutual(),path='/api/pairings/'+p.id+'/appointment';for(const invalid of [{...details(),members:['a','c']},{...details(),confirmations:['a','b']},{...details(),publicPlace:false},{...details(),startsAt:'2020-01-01T10:00:00Z'},{...details(),startsAt:'2026-12-01 16:00'},{...details(),cost:''}])assert.equal((await h.req('a',path,'POST',invalid)).status,400);const a=await h.req('a',path,'POST',details());assert.equal(a.status,201);const id=(await a.json()).appointment.id;assert.equal((await h.req('a','/api/appointments/'+id,'PATCH',{version:1,changes:{members:[h.users.a.id,h.users.c.id]}})).status,400);}finally{h.store.close();}
});
test('cancellation is terminal and deleting either account removes private meetings',async()=>{
 const h=harness();try{const a=await h.appointment(),path='/api/appointments/'+a.id;assert.equal((await h.req('b',path+'/cancel','POST',{version:1})).status,200);const current=(await (await h.req('a',path)).json()).appointment;assert.equal(current.status,'cancelled');assert.equal(current.version,2);assert.equal((await h.req('a',path+'/confirm','POST',{version:2})).status,409);assert.equal((await h.req('a',path,'PATCH',{version:2,changes:{cost:'Gratis'}})).status,409);h.store.deleteAccount(h.users.b.id);assert.equal((await h.req('a',path)).status,404);}finally{h.store.close();}
});
test('passing hides a pairing and cannot be reversed by a stale interest action',async()=>{
 const h=harness();try{const p=await h.offer();assert.equal((await h.req('b','/api/pairings/'+p.id+'/decision','POST',{decision:'no'})).status,200);assert.equal((await (await h.req('a','/api/pairings')).json()).pairings.length,0);assert.equal((await h.req('b','/api/pairings/'+p.id+'/decision','POST',{decision:'yes'})).status,404);}finally{h.store.close();}
});
test('adult eligibility is checked again inside the confirmation write',async()=>{
 const h=harness();try{const a=await h.appointment(),confirm=h.store.meetings.confirm;h.store.meetings.confirm=async(...args)=>{h.store.saveProfile(h.users.b.id,{adult:false});return confirm(...args);};assert.equal((await h.req('a','/api/appointments/'+a.id+'/confirm','POST',{version:1})).status,409);h.store.saveProfile(h.users.b.id,{adult:true});const current=(await (await h.req('a','/api/appointments/'+a.id)).json()).appointment;assert.deepEqual(current.confirmations,[]);}finally{h.store.close();}
});
test('a stale server snapshot cannot overwrite fields omitted from a newer expected-version patch',async()=>{
 const h=harness();try{
  const a=await h.appointment(),read=h.store.meetings.getAppointment;let once=true;
  h.store.meetings.getAppointment=async(user,id)=>{const row=await read(user,id);if(once&&row){once=false;await h.store.meetings.revise(h.users.b.id,id,1,{activity:row.activity,startsAt:new Date(row.starts_at).toISOString(),place:'Nuovo luogo pubblico',cost:row.cost});}return row;};
  const result=await h.req('a','/api/appointments/'+a.id,'PATCH',{version:2,changes:{cost:'5 EUR'}});assert.equal(result.status,409);const current=await read(h.users.a.id,a.id);assert.equal(current.place,'Nuovo luogo pubblico');assert.equal(current.version,2);
 }finally{h.store.close();}
});
test('interest can be withdrawn and repeated no is idempotent without reopening the pair',async()=>{
 const h=harness();try{const a=await h.appointment(),pairPath='/api/pairings/'+a.pairId;assert.equal((await h.req('a',pairPath+'/decision','POST',{decision:'no'})).status,200);assert.equal((await h.req('a',pairPath+'/decision','POST',{decision:'no'})).status,200);assert.equal((await h.req('a',pairPath+'/decision','POST',{decision:'yes'})).status,404);assert.equal((await h.req('b','/api/appointments/'+a.id)).status,404);}finally{h.store.close();}
});
test('a past appointment cannot be revived after matching has proposed a different person',async()=>{
 const h=harness(),clock=Date.now;try{const a=await h.appointment();for(const id of ['a','b','c'])await h.store.matching.save(h.users[id].id,{enabled:true,accepted:true,policyVersion:'2026-11-07',scope:'province',intent:'friendship',availability:['weekend_day']});Date.now=()=>clock()+2*86400000;const next=await h.store.matching.ensureSuggestion(h.users.a.id);assert.ok(next);assert.notEqual(next.id,a.pairId);const r=await h.req('a','/api/appointments/'+a.id,'PATCH',{version:1,changes:{startsAt:new Date(Date.now()+86400000).toISOString()}});assert.equal(r.status,409);}finally{Date.now=clock;h.store.close();}
});
