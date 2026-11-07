import {prepareRecipients,INVITE_MESSAGE} from '../src/invitations.mjs';
const reply=(error,status)=>Response.json({error},{status});
const channels=['email','phone'];
export const INVITATION_MESSAGE=INVITE_MESSAGE;
function publicUrl(value){
 try{
  const url=new URL(value),host=url.hostname.toLowerCase();
  return url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash&&(!url.port||url.port==='443')&&host.includes('.')&&!/[\[\]:]/.test(host)&&!/^\d+(?:\.\d+){3}$/.test(host)&&!/(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host)&&!/(^|\.)example\.(com|org|net)$/.test(host);
 }catch{return false;}
}
export function invitationReady(config,provider){
 return Boolean(config?.invitationsEnabled===true&&publicUrl(config.invitationUrl)&&/^[a-f\d]{64}$/i.test(config.invitationHashKey64hex||'')&&provider?.freePlanConfirmed===true&&provider.anonymousSender===true&&typeof provider.send==='function'&&Array.isArray(provider.channels)&&provider.channels.length>0&&provider.channels.every(channel=>channels.includes(channel)));
}
async function hmac(key,value){
 const bytes=new Uint8Array(key.match(/../g).map(v=>parseInt(v,16))),encoder=new TextEncoder();
 const imported=await crypto.subtle.importKey('raw',bytes,{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',imported,encoder.encode(value))),v=>v.toString(16).padStart(2,'0')).join('');
}
async function sendBounded(provider,input){
 const controller=new AbortController();let timer;
 try{
  const result=await Promise.race([
   new Promise(resolve=>{timer=setTimeout(()=>{controller.abort();resolve(null);},10000);}),
   provider.send({...input,signal:controller.signal})
  ]);
  return result?.accepted===true?'accepted':result?.accepted===false?'failed':'unknown';
 }catch{return 'unknown';}finally{clearTimeout(timer);}
}
export function createInvitationRoutes({store,config,invitationProvider=null}){
 return async({path,request,user,sessionHash,jsonBody})=>{
  if(path!=='/api/invitations')return null;
  if(!user?.id)return reply('Accedi per continuare.',401);
  if(request.method!=='POST')return reply('Metodo non consentito.',405);
  if(!invitationReady(config,invitationProvider))return reply('Gli inviti ufficiali non sono ancora disponibili.',503);
  const invitations=store.invitations;
  const actor=await invitations.actor(sessionHash,user.id);
  if(!actor)return reply('Il servizio richiede una sessione e un profilo maggiorenne attivi.',403);
  let body,recipients;
  try{
   body=await jsonBody(request);
   if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['batchId','recipients','anonymityAcknowledged'].includes(k))||body.anonymityAcknowledged!==true||typeof body.batchId!=='string'||!/^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(body.batchId))throw new Error();
   recipients=prepareRecipients(body.recipients);
   if(!recipients.every(r=>invitationProvider.channels.includes(r.channel)))throw new Error();
  }catch{return reply('Conferma l’anonimato e scegli da 1 a 20 destinatari validi nei canali disponibili.',400);}
  const hash=value=>hmac(config.invitationHashKey64hex,value);
  const accountHash=await hash(JSON.stringify(['account',actor.provider,actor.subject]));
  const contacts=await Promise.all(recipients.map(r=>hash(JSON.stringify(['contact',r.channel,r.address]))));
  const fingerprint=await hash(JSON.stringify(['batch',...contacts]));
  const batchId=body.batchId.toLowerCase();
  const reservation=await invitations.reserve({accountHash,batchId,fingerprint,contacts});
  if(reservation.error)return reply('Limite giornaliero degli inviti raggiunto.',429);
  if(reservation.row.fingerprint!==fingerprint)return reply('Questo invito è già associato ad altri destinatari.',409);
  if(reservation.owner){
   for(let i=0;i<recipients.length;i++){
    const idempotencyKey=await hash(JSON.stringify(['send',accountHash,batchId,contacts[i]]));
    // Revoke/deletion/suspension during an earlier send prevents the next one.
    if(!await invitations.actor(sessionHash,user.id)){
     await invitations.finish(accountHash,batchId,i,'failed');continue;
    }
    const status=await sendBounded(invitationProvider,{...recipients[i],message:INVITATION_MESSAGE,link:config.invitationUrl,idempotencyKey});
    await invitations.finish(accountHash,batchId,i,status);
   }
  }
  const row=await invitations.statuses(accountHash,batchId);
  const statuses=JSON.parse(row?.statuses||reservation.row.statuses);
  return Response.json({results:recipients.map((r,i)=>({...r,status:statuses[i]}))});
 };
}
