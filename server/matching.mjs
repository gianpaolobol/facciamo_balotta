import {POLICY_VERSION} from './matching-store.mjs';import {presentPair} from './meetings-store.mjs';
const availability=new Set(['weekday_day','weekday_evening','weekend_day','weekend_evening']);
export function createMatchingRoutes({store,enabled}){return async({path,request,user,jsonBody})=>{
 if(path!=='/api/preferences'&&!(path==='/api/pairings'&&request.method==='GET'))return null;
 if(!enabled)return path==='/api/preferences'?Response.json({error:'Le preferenze degli incontri sono ancora in preparazione.'},{status:503}):null;
 if((await store.getProfile(user.id))?.adult!==true)return Response.json({error:'Completa il profilo e conferma la maggiore età.'},{status:403});
 if(path==='/api/preferences'){
  if(request.method==='GET')return Response.json({preferences:await store.matching.get(user.id)});
  if(request.method!=='PUT')return new Response('Metodo non consentito',{status:405});
  const p=await jsonBody(request);if(Object.keys(p).some(k=>!['enabled','intent','scope','availability','accepted','policyVersion'].includes(k))||typeof p.enabled!=='boolean'||typeof p.accepted!=='boolean'||!['friendship','dating','both'].includes(p.intent)||!['province','region'].includes(p.scope)||!Array.isArray(p.availability)||p.availability.length>4||p.availability.some(v=>!availability.has(v))||p.policyVersion!==POLICY_VERSION||(p.enabled&&(!p.accepted||!p.availability.length)))return Response.json({error:'Controlla consenso, intenzione, zona e disponibilità.'},{status:400});
  const preferences={...p,availability:[...new Set(p.availability)]};await store.matching.save(user.id,preferences);return Response.json({preferences});
 }
 const suggestion=await store.matching.ensureSuggestion(user.id),pair=suggestion?await store.meetings.getPair(user.id,suggestion.id):null;
 if(!pair)return Response.json({pairings:[]});
 const data=presentPair(pair,user.id),a=await store.getProfile(user.id),b=await store.getProfile(data.peer.id),pa=await store.matching.get(user.id),pb=await store.matching.get(data.peer.id);
 return Response.json({pairings:[{...data,reasons:[...new Set(a?.interests||[])].filter(x=>b?.interests?.includes(x)),sharedAvailability:(pa?.availability||[]).filter(x=>pb?.availability?.includes(x))}]});
};}
