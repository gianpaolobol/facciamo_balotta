const reply=(error,status)=>Response.json({error},{status});
const missing=()=>reply('Contenuto non disponibile.',404);
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
const text=value=>typeof value==='string'&&value.trim().length>0&&value.length<=1000;
const present=m=>({id:m.id,senderId:m.sender_id,...(m.sender_name?{senderName:m.sender_name}:{}),body:m.body,created:m.created});
export function createCommunityRoutes({store,enabled,moderatorEmails=[]}){
 const moderators=new Set((Array.isArray(moderatorEmails)?moderatorEmails:String(moderatorEmails).split(',')).map(s=>s.trim().toLowerCase()).filter(Boolean));
 return async({path,request,user,jsonBody})=>{
  if(!/^\/api\/(chat|blocks|reports|moderation)(?:\/|$)/.test(path))return null;
  if(!enabled)return reply('I servizi della community sono ancora in preparazione.',503);
  if(!user?.id)return reply('Accedi per continuare.',401);
  const community=store.community,method=request.method;
  if(path.startsWith('/api/moderation')){
   if(!user.email||!moderators.has(user.email.toLowerCase()))return reply('Accesso riservato.',403);
   if(path==='/api/moderation/reports'&&method==='GET')return Response.json({reports:await community.listReports()});
   const resolve=path.match(/^\/api\/moderation\/reports\/([A-Za-z0-9-]{1,80})\/resolve$/);
   if(resolve&&method==='POST'){const body=await jsonBody(request);if(!object(body)||Object.keys(body).length!==1||typeof body.resolved!=='boolean')return reply('Scegli lo stato della segnalazione.',400);return await community.resolveReport(resolve[1],body.resolved)?Response.json({ok:true}):missing();}
   const match=path.match(/^\/api\/moderation\/users\/([A-Za-z0-9-]{1,80})\/suspend$/);
   if(match&&method==='POST'){const body=await jsonBody(request);if(!object(body)||Object.keys(body).length!==1||typeof body.suspended!=='boolean')return reply('Scegli lo stato di sospensione.',400);return await community.setSuspended(match[1],body.suspended)?Response.json({ok:true}):missing();}
   return reply('Operazione non disponibile.',405);
  }
  // Own block controls remain available for account safety, including while suspended.
  if(path==='/api/blocks'&&method==='GET')return Response.json({blocks:await community.listBlocks(user.id)});
  const unblock=path.match(/^\/api\/blocks\/([A-Za-z0-9-]{1,80})$/);
  if(unblock&&method==='DELETE'){await community.unblock(user.id,unblock[1]);return Response.json({ok:true});}
  if(await community.isSuspended(user.id)||(await store.getProfile(user.id))?.adult!==true)return reply('Il servizio richiede un profilo maggiorenne attivo.',403);
  if(path==='/api/blocks'&&method==='POST'){const body=await jsonBody(request);if(!object(body)||Object.keys(body).length!==1||!uuid(body.userId)||body.userId===user.id)return reply('Persona non valida.',400);return await community.block(user.id,body.userId)?Response.json({ok:true}):missing();}
  const chat=path.match(/^\/api\/chat\/(pair|group)\/([A-Za-z0-9-]{1,80})$/);
  if(chat){const [,kind,id]=chat;if(!['GET','POST'].includes(method))return reply('Metodo non consentito.',405);if(!await community.canChat(user.id,kind,id))return missing();
   if(method==='GET')return Response.json({messages:(await community.listMessages(user.id,kind,id)).map(present)});
   const body=await jsonBody(request);if(!object(body)||Object.keys(body).length!==2||!uuid(body.id)||!text(body.body))return reply('Inserisci un messaggio da 1 a 1000 caratteri e un ID valido.',400);
   const saved=await community.sendMessage(user.id,kind,id,body.id,body.body);return saved?Response.json({message:present(saved)},{status:201}):reply('Invio non disponibile: limite messaggi, ID già usato o accesso cambiato. Riprova dopo un minuto o ricarica.',409);
  }
  if(path==='/api/reports'&&method==='POST'){const body=await jsonBody(request),targets=['userId','groupId','messageId'];if(!object(body)||Object.keys(body).some(k=>!['reason',...targets].includes(k))||targets.filter(k=>body[k]!==undefined).length!==1||!text(body.reason))return reply('Scegli un solo contenuto e descrivi il motivo (1–1000 caratteri).',400);const target=targets.find(k=>body[k]!==undefined);if(!uuid(body[target]))return reply('Contenuto non valido.',400);if(!await community.canReport(user.id,target,body[target]))return missing();if(await community.report(user.id,target,body[target],body.reason.trim()))return Response.json({ok:true},{status:201});if(!await community.canReport(user.id,target,body[target]))return missing();return reply('Limite segnalazioni raggiunto: massimo 5 al giorno e 5000 conservate nel servizio.',429);}
  return reply('Operazione non disponibile.',405);
 };
}
