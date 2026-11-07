const error=(message,status)=>Response.json({error:message},{status});
export function createNotificationRoutes({store,enabled}){
 return async({path,request,user,jsonBody})=>{
  if(!/^\/api\/notifications(?:\/|$)/.test(path))return null;
  if(!enabled)return error('Gli aggiornamenti nell’app sono ancora in preparazione.',503);
  if(!user)return error('Accedi per continuare.',401);
  if(!await store.notifications.eligible(user.id))return error('Gli aggiornamenti richiedono un profilo maggiorenne idoneo.',403);
  if(path==='/api/notifications')return request.method==='GET'?Response.json(await store.notifications.list(user.id)):error('Metodo non consentito.',405);
  if(path==='/api/notifications/read-all'){
   if(request.method!=='POST')return error('Metodo non consentito.',405);
   let body;try{body=await jsonBody(request);}catch{return error('Richiesta non valida.',400);}
   if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length)return error('Richiesta non valida.',400);
   await store.notifications.markAllRead(user.id);return Response.json({ok:true});
  }
  const match=path.match(/^\/api\/notifications\/([1-9]\d*)\/read$/);
  if(!match||!Number.isSafeInteger(Number(match[1])))return error('Aggiornamento non trovato.',404);
  if(request.method!=='POST')return error('Metodo non consentito.',405);
  let body;try{body=await jsonBody(request);}catch{return error('Richiesta non valida.',400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length)return error('Richiesta non valida.',400);
  return await store.notifications.markRead(user.id,Number(match[1]))?Response.json({ok:true}):error('Aggiornamento non trovato.',404);
 };
}
