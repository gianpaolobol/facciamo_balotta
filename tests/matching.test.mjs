import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {MEETINGS_SCHEMA,createMeetingsStore} from '../server/meetings-store.mjs';
import {MATCHING_SCHEMA,createMatchingStore} from '../server/matching-store.mjs';
const prefs=(extra={})=>({enabled:true,intent:'friendship',scope:'province',availability:['weekend_day'],accepted:true,policyVersion:'2026-11-07',...extra});
function harness(){
 const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON;CREATE TABLE users(id TEXT PRIMARY KEY,name TEXT);CREATE TABLE profiles(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,data TEXT);CREATE TABLE user_blocks(blocker_id TEXT,blocked_id TEXT,created INTEGER,PRIMARY KEY(blocker_id,blocked_id));CREATE TABLE user_safety(user_id TEXT PRIMARY KEY,suspended INTEGER);');db.exec(MEETINGS_SCHEMA);db.exec(MATCHING_SCHEMA);
 let beforeInsert=null;const first=async(sql,...args)=>{if(beforeInsert&&sql.startsWith('INSERT INTO pairings')){const run=beforeInsert;beforeInsert=null;await run();}return db.prepare(sql).get(...args)??null;},all=async(sql,...args)=>db.prepare(sql).all(...args),matching=createMatchingStore({first,all});
 const add=async(id,profile={},preferences={})=>{db.prepare('INSERT INTO users VALUES(?,?)').run(id,id.toUpperCase());db.prepare('INSERT INTO profiles VALUES(?,?)').run(id,JSON.stringify({name:id,adult:true,city:'Bologna',interests:['Passeggiate','Musica'],...profile}));await matching.save(id,prefs(preferences));};
 return {db,matching,meetings:createMeetingsStore({first,all}),add,close:()=>db.close(),before:fn=>{beforeInsert=fn;}};
}
test('matching requires opt-in, accepted current policy, shared interests, intent and availability',async()=>{
 for(const [profile,preferences]of [[{interests:['Scacchi']},{}],[{adult:false},{}],[{}, {enabled:false}],[{}, {accepted:false}],[{}, {policyVersion:'old'}],[{}, {intent:'dating'}],[{}, {availability:['weekday_day']}],[{city:'Milano'},{}]]){
  const h=harness();try{await h.add('a');await h.add('b',profile,preferences);assert.equal(await h.matching.ensureSuggestion('a'),null);}finally{h.close();}
 }
 const h=harness();try{await h.add('a');await h.add('b');assert.ok(await h.matching.ensureSuggestion('a'));}finally{h.close();}
});
test('region matching needs both people to permit different provinces',async()=>{
 const h=harness();try{await h.add('a',{}, {scope:'region'});await h.add('b',{city:'Modena'});assert.equal(await h.matching.ensureSuggestion('a'),null);await h.matching.save('b',prefs({scope:'region'}));assert.ok(await h.matching.ensureSuggestion('a'));}finally{h.close();}
});
test('matching creates at most one active suggestion per person under concurrent requests',async()=>{
 const h=harness();try{for(const id of ['a','b','c'])await h.add(id);await Promise.all(['a','b','c','a','b'].map(id=>h.matching.ensureSuggestion(id)));const rows=h.db.prepare('SELECT first_user,second_user FROM pairings').all();assert.equal(rows.length,1);assert.equal(new Set(rows.flatMap(r=>[r.first_user,r.second_user])).size,2);}finally{h.close();}
});
test('matching ignores portraits and never recreates a previously declined pair',async()=>{
 const h=harness();try{await h.add('a',{portrait:'nice'});await h.add('b',{portrait:'anything'});const pair=await h.matching.ensureSuggestion('a');await h.meetings.decide('a',pair.id,'no');assert.equal(await h.matching.ensureSuggestion('a'),null);}finally{h.close();}
});
test('blocking and suspension prevent suggestions and write rechecks a changed consent',async()=>{
 for(const mode of ['block','suspend','during']){const h=harness();try{await h.add('a');await h.add('b');if(mode==='block')h.db.prepare('INSERT INTO user_blocks VALUES(?,?,?)').run('b','a',Date.now());if(mode==='suspend')h.db.prepare('INSERT INTO user_safety VALUES(?,1)').run('b');if(mode==='during')h.before(()=>h.matching.save('b',prefs({enabled:false})));assert.equal(await h.matching.ensureSuggestion('a'),null);}finally{h.close();}}
});
test('blocking ends a previous pairing permanently while allowing a different suggestion',async()=>{
 const h=harness();try{await h.add('a');await h.add('b');const p=await h.matching.ensureSuggestion('a');h.db.prepare('INSERT INTO user_blocks VALUES(?,?,?)').run('a','b',Date.now());await h.add('c');const next=await h.matching.ensureSuggestion('a');assert.ok(next);assert.notEqual(next.id,p.id);h.db.prepare('DELETE FROM user_blocks').run();const old=h.db.prepare('SELECT * FROM pairings WHERE id=?').get(p.id);assert.ok(old.first_decision==='no'||old.second_decision==='no');}finally{h.close();}
});
test('withdrawing discovery consent hides a pending suggestion from both people',async()=>{
 const h=harness();try{await h.add('a');await h.add('b');const p=await h.matching.ensureSuggestion('a');assert.ok(p);await h.matching.save('b',prefs({enabled:false}));assert.equal(await h.matching.ensureSuggestion('a'),null);assert.equal(await h.meetings.getPair('a',p.id),null);}finally{h.close();}
});
