export function createPeerImageRoutes({store,enabled}){return async({path,request,user})=>{
 const match=path.match(/^\/api\/pairings\/([A-Za-z0-9-]{1,80})\/illustrations\/(portrait|interest-[1-5])$/);if(!match)return null;
 if(!enabled)return Response.json({error:'Il profilo condiviso non è ancora disponibile.'},{status:503});
 if(request.method!=='GET')return new Response('Metodo non consentito',{status:405});
 const [,id,slot]=match,pair=await store.meetings.getPair(user.id,id);if(!pair)return new Response('Non trovato',{status:404});
 const approved=await store.getSharedProfileImage(user.id,id,slot);
 return Response.json({image:approved?{id:approved.id,slot,dataUri:`data:${approved.mime};base64,${Buffer.from(approved.data).toString('base64')}`}:null});
};}
