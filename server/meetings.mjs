import {presentPair,presentAppointment} from './meetings-store.mjs';
const invalid=message=>Response.json({error:message},{status:400});
const conflict=()=>Response.json({error:'La proposta è cambiata o non è più disponibile. Ricarica prima di riprovare.'},{status:409});
const fields=['activity','startsAt','place','cost','publicPlace'];
function validate(data){
 if(!data||Array.isArray(data)||typeof data!=='object'||Object.keys(data).some(k=>!fields.includes(k))||data.publicPlace!==true)throw Error('Scegli un luogo pubblico e completa tutti i dettagli.');
 for(const [key,max]of [['activity',140],['place',240],['cost',140]])if(typeof data[key]!=='string'||!data[key].trim()||data[key].length>max)throw Error('Controlla attività, luogo e costo.');
 const match=typeof data.startsAt==='string'&&data.startsAt.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/),time=Date.parse(data.startsAt),now=Date.now();
 if(!match||Number(match[2])<1||Number(match[2])>12||Number(match[3])<1||Number(match[3])>new Date(Date.UTC(Number(match[1]),Number(match[2]),0)).getUTCDate()||Number(match[4])>23||Number(match[5])>59||Number(match[6])>59||!Number.isFinite(time)||time<=now||time>now+180*86400000)throw Error('Inserisci una data futura valida con fuso orario, entro180giorni.');
 return {activity:data.activity.trim(),place:data.place.trim(),cost:data.cost.trim(),startsAt:new Date(time).toISOString(),publicPlace:true};
}
export function createMeetingRoutes({store,enabled}){
 return async({path,request,user,jsonBody})=>{
  if(!/^\/api\/(pairings|appointments)(?:\/|$)/.test(path))return null;
  if(!enabled)return Response.json({error:'Gli appuntamenti reali sono ancora in preparazione.'},{status:503});
  if((await store.getProfile(user.id))?.adult!==true)return Response.json({error:'Completa il profilo e conferma la maggiore età.'},{status:403});
  const meetings=store.meetings,method=request.method,match=path.match(/^\/api\/(pairings|appointments)(?:\/([A-Za-z0-9-]{1,80}))?(?:\/(decision|appointment|confirm|cancel))?$/);
  if(!match)return new Response('Non trovato',{status:404});
  const [,kind,id,action]=match;
  if(!id){if(method!=='GET')return new Response('Metodo non consentito',{status:405});return kind==='pairings'?Response.json({pairings:(await meetings.listPairs(user.id)).map(r=>presentPair(r,user.id))}):Response.json({appointments:(await meetings.listAppointments(user.id)).map(presentAppointment)});}
  const current=kind==='pairings'?await meetings.getPair(user.id,id):await meetings.getAppointment(user.id,id);
  if(!current)return new Response('Non trovato',{status:404});
  if(!action&&method==='GET')return kind==='pairings'?Response.json({pairing:presentPair(current,user.id)}):Response.json({appointment:presentAppointment(current)});
  if(kind==='pairings'&&action==='decision'&&method==='POST'){
   const body=await jsonBody(request);if(Object.keys(body).length!==1||!['yes','no'].includes(body.decision))return invalid('Scegli se questa persona ti interessa.');
   return await meetings.decide(user.id,id,body.decision)?Response.json({ok:true}):conflict();
  }
  if(kind==='pairings'&&action==='appointment'&&method==='POST'){
   let data;try{data=validate(await jsonBody(request));}catch(e){return invalid(e.message);}
   const created=await meetings.createAppointment(user.id,id,data);if(!created)return conflict();
   const saved=await meetings.getAppointment(user.id,created.id);return saved?Response.json({appointment:presentAppointment(saved)},{status:201}):conflict();
  }
  if(kind==='appointments'&&((!action&&method==='PATCH')||(['confirm','cancel'].includes(action)&&method==='POST'))){
   const body=await jsonBody(request);if(!Number.isSafeInteger(body.version)||body.version<1)return invalid('Versione non valida.');
   if(current.version!==body.version)return conflict();
   let result;
   if(!action){
    if(Object.keys(body).some(k=>!['version','changes'].includes(k))||!body.changes||Array.isArray(body.changes)||typeof body.changes!=='object'||!Object.keys(body.changes).length||Object.keys(body.changes).some(k=>!fields.includes(k)))return invalid('Questa modifica non è consentita.');
    let data;try{const a=presentAppointment(current);data=validate({...Object.fromEntries(fields.map(k=>[k,a[k]])),...body.changes});}catch(e){return invalid(e.message);}
    result=await meetings.revise(user.id,id,body.version,data);
   }else{if(Object.keys(body).length!==1)return invalid('Richiesta non valida.');result=await meetings[action](user.id,id,body.version);}
   if(!result)return conflict();const saved=await meetings.getAppointment(user.id,id);return saved?Response.json({appointment:presentAppointment(saved)}):conflict();
  }
  return new Response('Metodo non consentito',{status:405});
 };
}
