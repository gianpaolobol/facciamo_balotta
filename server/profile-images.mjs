import {createHash} from 'node:crypto';
import {ILLUSTRATION_IDS} from '../src/illustrated-draft.mjs';
const digest=text=>createHash('sha256').update(text).digest('hex');
const fail=(error,status)=>Response.json({error},{status});
export function createProfileImageRoutes({store,provider}){
 function slotView(userId,slot){
  const snapshot=store.getIllustratedProfile(userId);const text=snapshot.draft?.confirmed[slot];
  const rows=text?store.getProfileImages(userId,slot).filter(row=>row.description_hash===digest(text)):[];
  const row=rows[0],approved=rows.find(row=>row.approved);
  return {image:row?{id:row.id,approved:Boolean(row.approved),descriptionHash:row.description_hash,model:row.model,styleVersion:row.style_version,dataUri:'data:'+row.mime+';base64,'+Buffer.from(row.data).toString('base64')}:null,approvedId:approved?.id||null};
 }
 return async({path,request,user,jsonBody})=>{
  const imagePath=path.match(/^\/api\/illustrated-profile\/images\/(portrait|interest-[1-5])$/);
  if(imagePath&&request.method==='GET')return Response.json(slotView(user.id,imagePath[1]));
  if(path==='/api/illustrated-profile/ai-status'&&request.method==='GET')return Response.json({enabled:Boolean(provider?.ready),model:provider?.model||null,freeOnly:true});
  const action=path.match(/^\/api\/illustrated-profile\/(generate|approve|discard)$/)?.[1];
  if(!action)return null;
  if(request.method!=='POST')return fail('Metodo non consentito.',405);
  const body=await jsonBody(request);
  if(!ILLUSTRATION_IDS.includes(body.slot)||!Number.isSafeInteger(body.version))return fail('Richiesta non valida.',400);
  const snapshot=store.getIllustratedProfile(user.id),description=snapshot.draft?.confirmed[body.slot];
  if(snapshot.version!==body.version)return fail('Salva e ricarica la bozza aggiornata prima di generare o approvare.',409);
  if(!description)return fail('Conferma e salva prima la descrizione.',400);
  const descriptionHash=digest(description);
  if(action==='approve'||action==='discard'){
   const image=store.getProfileImages(user.id,body.slot).find(row=>row.id===body.id&&row.description_hash===descriptionHash);
   if(!image)return fail('Immagine non trovata.',404);
   const ok=action==='approve'?store.approveProfileImage(user.id,body.slot,body.id):store.discardProfileImage(user.id,body.slot,body.id);
   return ok?Response.json(slotView(user.id,body.slot)):fail('L’immagine approvata non può essere scartata da questo comando.',400);
  }
  if(store.getProfile(user.id)?.adult!==true)return fail('Completa prima il profilo e la conferma di maggiore età.',403);
  if(!provider?.ready)return fail('Generazione in preparazione: collegamento gratuito non ancora attivato.',503);
  const job=store.reserveImageAttempt(provider.accountId,user.id,body.slot);
  if(job.error)return fail(job.error==='quota'?'Limite gratuito giornaliero raggiunto. Riprova domani.':'Una generazione è già in corso.',job.error==='quota'?429:409);
  try{
   const result=await provider.generate({slot:body.slot,description});
   const latest=store.getIllustratedProfile(user.id);
   if(latest.version!==snapshot.version){store.finishImageAttempt(job.id,false);return fail('La descrizione è cambiata durante la generazione. Riprova con la bozza aggiornata.',409);}
   store.saveProfileImage(user.id,body.slot,descriptionHash,result,job.id);store.finishImageAttempt(job.id,true);
   return Response.json(slotView(user.id,body.slot));
  }catch(error){store.finishImageAttempt(job.id,false);return fail(error.status===429?'Quota gratuita esaurita o servizio occupato. Riprova più tardi.':'Generazione non disponibile. La tua immagine approvata resta conservata.',error.status===429?429:503);}
 };
}
