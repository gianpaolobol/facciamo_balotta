import {normalizeRecipient,INVITE_MESSAGE} from './invitations.mjs';
export const PERSONAL_INVITE_NOTE='L’invito non include il tuo profilo Balotta. WhatsApp, SMS ed email mostrano il mittente.';
const channels=new Set(['whatsapp','sms','email']);
export function phoneContacts(rows){
 const contacts=new Map();
 for(const row of rows||[]){
  const name=typeof row.name==='string'?row.name.replace(/[\x00-\x1f\x7f]/g,'').trim():'';
  if(!name||name.includes('@')||/^[+\d ().-]+$/.test(name)||typeof row.id!=='string'||!row.id)continue;
  const phones=[],emails=[];
  for(const raw of row.phones||[]){try{if(typeof raw!=='string')continue;let address=raw.trim();if(!/^(\+|00)/.test(address))address='+39'+address;phones.push(normalizeRecipient({channel:'phone',address}).address);}catch{}}
  for(const raw of row.emails||[]){try{emails.push(normalizeRecipient({channel:'email',address:raw}).address);}catch{}}
  const prior=contacts.get(row.id);
  const value={id:row.id,name:prior?.name||name,phones:[...new Set([...(prior?.phones||[]),...phones])],emails:[...new Set([...(prior?.emails||[]),...emails])]};
  if(value.phones.length||value.emails.length)contacts.set(row.id,value);
 }
 return [...contacts.values()].sort((a,b)=>a.name.localeCompare(b.name,'it'));
}
export function contactQueue(contacts,selected,channel){
 if(!channels.has(channel))throw Error('Scegli un canale disponibile.');
 const ids=new Set(selected),unique=new Map();
 for(const contact of contacts){if(!ids.has(contact.id))continue;const address=channel==='email'?contact.emails[0]:contact.phones[0];if(!address)continue;if(!unique.has(address))unique.set(address,{contactId:contact.id,name:contact.name,address,channel});}
 if(!unique.size)throw Error('Scegli almeno un contatto disponibile per questo canale.');
 return [...unique.values()];
}
export function personalInviteMessage(value){
 let url;try{url=new URL(value);}catch{throw Error('Il link di invito non è ancora disponibile.');}
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!url.hostname.includes('.')||/(^|\.)(localhost|test|example|invalid|internal|local)$/.test(url.hostname)||/(^|\.)example\.(com|org|net)$/.test(url.hostname))throw Error('Il link di invito non è ancora disponibile.');
 return INVITE_MESSAGE+'\n'+url.href;
}
export function createContactInviteQueue({compose}){
 let queue=[],index=0,busy=false,epoch=0,message='';
 const snapshot=()=>({total:queue.length,index,busy,currentName:queue[index]?.name||'',complete:queue.length>0&&index>=queue.length});
 return {
  snapshot,
  start(values,text){if(busy)throw Error('Completa prima l’apertura in corso.');if(!Array.isArray(values)||!values.length)throw Error('Selezione non valida.');epoch++;queue=values.map(v=>({...v}));index=0;message=text;},
  reset(){epoch++;queue=[];index=0;busy=false;message='';},
  reconcile(contacts){
   const current=new Map(contacts.map(c=>[c.id,c]));
   if(queue.some(entry=>{const c=current.get(entry.contactId);return !c||!(entry.channel==='email'?c.emails:c.phones).includes(entry.address);})){epoch++;queue=[];index=0;busy=false;message='';return false;}
   queue=queue.map(entry=>({...entry,name:current.get(entry.contactId).name}));return true;
  },
  skip(){if(busy||index>=queue.length)return false;index++;return true;},
  async next(){
   if(busy||index>=queue.length)return null;
   busy=true;const version=epoch,entry=queue[index];
   try{const result=await compose({channel:entry.channel,address:entry.address,message},()=>epoch===version);if(epoch!==version)return null;const status=['opened','sent','cancelled','saved','unknown'].includes(result?.status)?result.status:'unknown';if(status!=='cancelled')index++;return {status,name:entry.name};}
   catch{if(epoch===version)throw Error('Non è stato possibile aprire il canale scelto. Riprova oppure salta questo contatto.');return null;}
   finally{if(epoch===version)busy=false;}
  }
 };
}
export function createContactReadScope(){
 let ticket=0,checking=false;
 const next=()=>{const version=++ticket;return()=>ticket===version;};
 return {beginRead:next,beginRefresh(){checking=true;return next();},finishRefresh(current){if(current())checking=false;},isChecking:()=>checking,reset(){ticket++;checking=false;}};
}
