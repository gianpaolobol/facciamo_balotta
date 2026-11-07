import test from 'node:test';
import assert from 'node:assert/strict';
import {createContactAdapterFlow} from '../src/contact-adapter-flow.mjs';

const granted={status:'granted',granted:true,canAskAgain:true,expires:'never',accessPrivileges:'all'};
const denied={status:'denied',granted:false,canAskAgain:false,expires:'never',accessPrivileges:'none'};
function fixture(overrides={}) {
 const calls=[];
 const deps={supported:true,
  getPermission:async()=>{calls.push('permission');return granted;},
  requestPermission:async()=>{calls.push('request');return granted;},
  getPage:async query=>{calls.push(query);return {data:[],hasNextPage:false,hasPreviousPage:false,total:0};},
  smsAvailable:async()=>true,
  sendSMS:async(addresses,message)=>{calls.push({addresses,message});return {result:'unknown'};},
  mailAvailable:async()=>true,
  composeMail:async options=>{calls.push(options);return {status:'undetermined'};},
  openURL:async url=>{calls.push(url);},...overrides};
 return {flow:createContactAdapterFlow(deps),calls};
}
const current=()=>true;
function composerFixture(overrides={}) {
 return fixture({getPage:async()=>({data:[{id:'a',name:'Ada',phoneNumbers:[{number:'333 123 4567'}],emails:[{email:'ADA@example.test'}]}],hasNextPage:false,hasPreviousPage:false,total:1}),...overrides});
}

test('construction performs no permission, import, or composer action',()=>{
 const {calls}=fixture();assert.deepEqual(calls,[]);
});
test('denied permission never reads contacts',async()=>{
 const {flow,calls}=fixture({getPermission:async()=>denied});
 await assert.rejects(flow.readContacts(current),/consent|impostazioni/i);
 assert.deepEqual(calls,[]);
});
test('explicit import requests permission only when askable',async()=>{
 let permission={...denied,canAskAgain:true};
 const {flow,calls}=fixture({getPermission:async()=>permission,requestPermission:async()=>{calls.push('request');permission=granted;return granted;}});
 assert.deepEqual(await flow.readContacts(current),{contacts:[],limited:false});
 assert.equal(calls[0],'request');assert.equal(calls.length,2);
});
test('limited import pages only name and delivery fields and drops unnamed records',async()=>{
 const {flow,calls}=fixture({getPermission:async()=>({...granted,accessPrivileges:'limited'}),getPage:async query=>{
  calls.push(query);
  return query.pageOffset===0?{data:[{id:'a',name:' Ada ',phoneNumbers:[{number:'+393331234567'}],emails:[{email:'ada@example.test'}]},{id:'b',name:' ',phoneNumbers:[{number:'123'}]}],hasNextPage:true,hasPreviousPage:false,total:3}:{data:[{id:'c',name:'Ada'}],hasNextPage:false,hasPreviousPage:true,total:3};
 }});
 assert.deepEqual(await flow.readContacts(current),{contacts:[{id:'a',name:'Ada',phones:['+393331234567'],emails:['ada@example.test']},{id:'c',name:'Ada',phones:[],emails:[]}],limited:true});
 assert.deepEqual(calls,[{fields:['name','phoneNumbers','emails'],pageSize:200,pageOffset:0},{fields:['name','phoneNumbers','emails'],pageSize:200,pageOffset:2}]);
});
test('foreground permission check never asks and returns false after revocation or errors',async()=>{
 let permission=granted;
 const {flow,calls}=fixture({getPermission:async()=>permission});
 assert.equal(await flow.hasPermission(),true);permission=denied;
 assert.equal(await flow.hasPermission(),false);assert.deepEqual(calls,[]);
 const failed=fixture({getPermission:async()=>{throw Error('private contact');}});
 assert.equal(await failed.flow.hasPermission(),false);
});
test('epoch cancellation before permission prevents all operations',async()=>{
 const {flow,calls}=fixture();await assert.rejects(flow.readContacts(()=>false),/annullata/i);assert.deepEqual(calls,[]);
});
test('epoch change during permission request prevents contacts read',async()=>{
 let active=true;
 const {flow,calls}=fixture({getPermission:async()=>({...denied,canAskAgain:true}),requestPermission:async()=>{active=false;return granted;}});
 await assert.rejects(flow.readContacts(()=>active),/annullata/i);assert.deepEqual(calls,[]);
});
test('epoch change during a page discards all contacts and prevents next page',async()=>{
 let active=true;
 const {flow,calls}=fixture({getPage:async()=>{calls.push('page');active=false;return {data:[{id:'a',name:'Private'}],hasNextPage:true};}});
 await assert.rejects(flow.readContacts(()=>active),/annullata/i);assert.deepEqual(calls,['permission','page']);
});
test('SDK errors are sanitized without names, addresses, or URLs',async()=>{
 const {flow}=fixture({getPage:async()=>{throw Error('Ada ada@example.test https://private.test');}});
 const composer=composerFixture({openURL:async()=>{throw Error('https://wa.me/393331234567');}});
 for(const op of [()=>flow.readContacts(current),()=>composer.flow.compose({channel:'whatsapp',address:'+393331234567',message:'Ciao'})]) {
  await assert.rejects(op(),error=>!(/Ada|example|private|wa\.me|393331234567/.test(error.message)));
 }
});
test('WhatsApp opens one official prefilled link and reports only opened',async()=>{
 const {flow,calls}=composerFixture();
 assert.deepEqual(await flow.compose({channel:'whatsapp',address:'+393331234567',message:'Ciao & a presto!'}),{status:'opened'});
 assert.deepEqual(calls,['permission','permission','https://wa.me/393331234567?text=Ciao%20%26%20a%20presto!']);
});
test('SMS uses one recipient and maps sent, cancelled, and unknown without claiming delivery',async()=>{
 for(const result of ['sent','cancelled','unknown']){
  const {flow,calls}=composerFixture({sendSMS:async(addresses,message)=>{calls.push({addresses,message});return {result};}});
  assert.deepEqual(await flow.compose({channel:'sms',address:'+393331234567',message:'Ciao'}),{status:result});
  assert.deepEqual(calls,['permission','permission',{addresses:['+393331234567'],message:'Ciao'}]);
 }
});
test('mail uses one recipient and maps native composer results truthfully',async()=>{
 for(const [result,status] of [['sent','sent'],['saved','saved'],['cancelled','cancelled'],['undetermined','unknown']]){
  const {flow,calls}=composerFixture({composeMail:async options=>{calls.push(options);return {status:result};}});
  assert.deepEqual(await flow.compose({channel:'email',address:'ada@example.test',message:'Ciao'}),{status});
  assert.deepEqual(calls,['permission','permission',{recipients:['ada@example.test'],subject:'Un invito a Balotta',body:'Ciao',isHtml:false}]);
 }
});
test('unavailable composers never open',async()=>{
 const {flow,calls}=fixture({smsAvailable:async()=>false,mailAvailable:async()=>false});
 for(const channel of ['sms','email'])await assert.rejects(flow.compose({channel,address:channel==='sms'?'+393331234567':'ada@example.test',message:'Ciao'}),/disponibile/i);
 assert.deepEqual(calls,[]);
});
test('epoch change during availability prevents composer and during composer discards result',async()=>{
 let active=true;
 const before=fixture({smsAvailable:async()=>{active=false;return true;}});
 await assert.rejects(before.flow.compose({channel:'sms',address:'+393331234567',message:'Ciao'},()=>active),/annullata/i);
 assert.deepEqual(before.calls,[]);
 active=true;
 const after=composerFixture({composeMail:async()=>{active=false;return {status:'sent'};}});
 await assert.rejects(after.flow.compose({channel:'email',address:'ada@example.test',message:'Ciao'},()=>active),/annullata/i);
});
test('rejects recipient lists, malformed input and unsupported web without opening anything',async()=>{
 const {flow,calls}=fixture();
 for(const [channel,address] of [['sms','+39123,+39456'],['email','a@example.test,b@example.test'],['whatsapp','https://evil.test'],['other','+393331234567']]){
  await assert.rejects(flow.compose({channel,address,message:'Ciao'}),/recapito|canale/i);
 }
 assert.deepEqual(calls,[]);
 const web=fixture({supported:false});
 assert.equal(await web.flow.hasPermission(),false);
 await assert.rejects(web.flow.readContacts(current),/app.*nativa/i);
 await assert.rejects(web.flow.compose({channel:'sms',address:'+393331234567',message:'Ciao'}),/app.*nativa/i);
 assert.deepEqual(web.calls,[]);
});

test('refresh never requests permission even when it could be requested',async()=>{
 const {flow,calls}=fixture({getPermission:async()=>({...denied,canAskAgain:true})});
 await assert.rejects(flow.refreshContacts(current),/consent|impostazioni/i);
 assert.deepEqual(calls,[]);
});
test('page completion after permission revocation discards its contacts',async()=>{
 let permission=granted,finishPage;
 const {flow}=fixture({getPermission:async()=>permission,getPage:()=>new Promise(resolve=>{finishPage=resolve;})});
 const pending=flow.readContacts(current);
 await new Promise(resolve=>setImmediate(resolve));
 permission=denied;
 finishPage({data:[{id:'a',name:'Ada',phoneNumbers:[{number:'3331234567'}]}],hasNextPage:false});
 await assert.rejects(pending,/consent|impostazioni/i);
});
test('denied permission blocks all composer handoffs without requesting access',async()=>{
 for(const [channel,address] of [['whatsapp','+393331234567'],['sms','+393331234567'],['email','ada@example.test']]){
  const {flow,calls}=fixture({getPermission:async()=>({...denied,canAskAgain:true})});
  await assert.rejects(flow.compose({channel,address,message:'Ciao'}),/consent|impostazioni/i);
  assert.deepEqual(calls,[]);
 }
});
test('limited scope shrinking removes recipient eligibility before each handoff',async()=>{
 let visible=true,opened=0;
 const {flow}=fixture({getPermission:async()=>({...granted,accessPrivileges:'limited'}),getPage:async()=>({data:visible?[{id:'a',name:'Ada',phoneNumbers:[{number:'3331234567'}],emails:[{email:'ada@example.test'}]}]:[],hasNextPage:false}),openURL:async()=>{opened++;},sendSMS:async()=>{opened++;return {result:'sent'};},composeMail:async()=>{opened++;return {status:'sent'};}});
 assert.equal((await flow.readContacts(current)).contacts.length,1);
 visible=false;
 for(const [channel,address] of [['whatsapp','+393331234567'],['sms','+393331234567'],['email','ada@example.test']])await assert.rejects(flow.compose({channel,address,message:'Ciao'}),/accessibil|disponibil/i);
 assert.equal(opened,0);
});
test('recipient eligibility is refreshed after asynchronous composer availability',async()=>{
 let visible=true,opened=0;
 const {flow}=fixture({getPage:async()=>({data:visible?[{id:'a',name:'Ada',phoneNumbers:[{number:'3331234567'}]}]:[],hasNextPage:false}),smsAvailable:async()=>{visible=false;return true;},sendSMS:async()=>{opened++;return {result:'sent'};}});
 await assert.rejects(flow.compose({channel:'sms',address:'+393331234567',message:'Ciao'}),/accessibil|disponibil/i);
 assert.equal(opened,0);
});
