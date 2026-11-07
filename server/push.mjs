const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX64=/^[0-9a-f]{64}$/i;
const TOKEN=/^(?:ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{10,200}\]$/;
export function pushReady(config={}){return config.pushEnabled===true&&UUID.test(config.pushProjectId||'')&&HEX64.test(config.pushEncryptionKey||'')&&typeof config.expoAccessToken==='string'&&config.expoAccessToken.trim().length>0&&!/[\r\n]/.test(config.expoAccessToken);}
export async function pushHash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');}
const bytes=hex=>Uint8Array.from(hex.match(/../g),x=>parseInt(x,16));
const base64=data=>btoa(String.fromCharCode(...new Uint8Array(data)));
const unbase64=data=>Uint8Array.from(atob(data),x=>x.charCodeAt(0));
async function key(hex){return crypto.subtle.importKey('raw',bytes(hex),'AES-GCM',false,['encrypt','decrypt']);}
export async function encryptPushToken(token,hex){const iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(hex),new TextEncoder().encode(token));return base64(iv)+'.'+base64(cipher);}
export async function decryptPushToken(cipher,hex){const [iv,data]=cipher.split('.');return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unbase64(iv)},await key(hex),unbase64(data)));}
const error=(message,status)=>Response.json({error:message},{status});
function proofBody(body,register=false){const fields=register?['installationId','installationSecret','token','projectId']:['installationId','installationSecret'];return body&&typeof body==='object'&&!Array.isArray(body)&&Object.keys(body).length===fields.length&&fields.every(k=>Object.hasOwn(body,k)&&typeof body[k]==='string')&&UUID.test(body.installationId||'')&&HEX64.test(body.installationSecret||'')&&(!register||(TOKEN.test(body.token||'')&&UUID.test(body.projectId||'')));}
export function createPushRoutes({store,config}){
 return async({path,request,user,sessionHash,jsonBody})=>{
  if(path!=='/api/push/device'&&path!=='/auth/push/disable')return null;
  if(path==='/auth/push/disable'){
   if(request.method!=='POST')return error('Metodo non consentito.',405);
   let body;try{body=await jsonBody(request);}catch{return error('Richiesta non valida.',400);}
   if(!proofBody(body))return error('Richiesta non valida.',400);
   await store.push.disable(body.installationId,await pushHash(body.installationSecret));return Response.json({ok:true});
  }
  if(!['GET','POST'].includes(request.method))return error('Metodo non consentito.',405);
  if(!user||!sessionHash)return error('Accedi per continuare.',401);
  if(request.method==='GET')return Response.json({enabled:pushReady(config)&&Boolean(await store.push.status(user.id,sessionHash))});
  if(!pushReady(config))return error('Gli avvisi push sono ancora in preparazione.',503);
  if(!await store.notifications.eligible(user.id))return error('Gli avvisi richiedono un profilo maggiorenne idoneo.',403);
  let body;try{body=await jsonBody(request);}catch{return error('Richiesta non valida.',400);}
  if(!proofBody(body,true)||body.projectId!==config.pushProjectId)return error('Richiesta non valida.',400);
  const row=await store.push.register({installationId:body.installationId,proofHash:await pushHash(body.installationSecret),deviceKey:await pushHash(body.installationId),tokenCipher:await encryptPushToken(body.token,config.pushEncryptionKey),tokenHash:await pushHash(body.token),userId:user.id,sessionHash,projectId:body.projectId,version:crypto.randomUUID()});
  return row?Response.json({ok:true}):error('Registrazione non disponibile per questa installazione o sessione.',409);
 };
}
