import {createProfileImageRoutes} from './profile-images.mjs';
import {verifyAppleToken,verifyAppleNotification} from './apple-token.mjs';
import {appleRevocationReady,revokeAppleAuthorization} from './apple-revoke.mjs';
import {createMeetingRoutes} from './meetings.mjs';
import {createGroupRoutes} from './groups.mjs';
import {createCommunityRoutes} from './community.mjs';
import {createMatchingRoutes} from './matching.mjs';
import {createPeerImageRoutes} from './peer-images.mjs';
import {createNotificationRoutes} from './notifications.mjs';
import {createInvitationRoutes,invitationReady} from './invitations.mjs';
import {createPushRoutes,pushReady} from './push.mjs';
import {validateIllustratedDraft} from '../src/illustrated-draft.mjs';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

const random=()=>randomBytes(32).toString('base64url');
const hash=s=>createHash('sha256').update(s).digest('base64url');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const cookies=request=>Object.fromEntries((request.headers.get('cookie')||'').split(';').map(s=>s.trim().split('=')).filter(p=>p.length===2));
const cities=new Set(['Bologna','Ferrara','Forlì-Cesena','Modena','Parma','Piacenza','Ravenna','Reggio Emilia','Rimini']);

export function createApp({config,store,providerFetch=fetch,imageProvider=null,invitationProvider=null}) {
 const origin=new URL(config.origin).origin;
 const profileImages=createProfileImageRoutes({store,provider:imageProvider});
 const meetingRoutes=createMeetingRoutes({store,enabled:config.meetingsEnabled===true});
 const groupRoutes=createGroupRoutes({store,enabled:config.groupsEnabled===true});
 const communityRoutes=createCommunityRoutes({store,enabled:config.communityEnabled===true,moderatorEmails:config.moderatorEmails||[]});
 const matchingRoutes=createMatchingRoutes({store,enabled:config.matchingEnabled===true&&config.meetingsEnabled===true});
 const peerImageRoutes=createPeerImageRoutes({store,enabled:config.matchingEnabled===true&&config.meetingsEnabled===true});
 const notificationRoutes=createNotificationRoutes({store,enabled:config.notificationsEnabled===true});
 const pushRoutes=createPushRoutes({store,config});
 const invitationRoutes=createInvitationRoutes({store,config,invitationProvider});
 const secure=origin.startsWith('https:');
 const cookie=(name,value,maxAge)=>`${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure?'; Secure':''}`;
 const ready=provider=>config.enabled===true && (provider==='google'?Boolean(config.googleId&&config.googleSecret):provider==='facebook'?Boolean(config.facebookId&&config.facebookSecret&&/^v\d+\.\d+$/.test(config.facebookVersion||'')):false);
 const appleReady=()=>config.enabled===true&&config.appleNativeEnabled===true&&config.appleBundleId==='it.facciamobalotta.app';
 async function sessionResponse(user,native=false) {
  const token=random();
  await store.putSession(hash(token),user.id);
  return native?Response.json({token},{headers:{'cache-control':'no-store'}}):new Response(null,{status:303,headers:{location:origin+'/?auth=success','set-cookie':cookie('balotta_session',token,604800)}});
 }
 async function jsonBody(request,maxChars=16_384) {
  const text=await request.text(); if(text.length>maxChars) throw new Error('payload');
  const body=JSON.parse(text); if(!body||Array.isArray(body)||typeof body!=='object') throw new Error('payload'); return body;
 }
 async function route(request) {
  const url=new URL(request.url); const path=url.pathname;
  if(path==='/api/config') return Response.json({providers:{google:ready('google'),facebook:ready('facebook'),apple:appleReady()},features:{meetings:config.meetingsEnabled===true,matching:config.matchingEnabled===true&&config.meetingsEnabled===true,groups:config.groupsEnabled===true,community:config.communityEnabled===true,notifications:config.notificationsEnabled===true,push:pushReady(config),invitations:invitationReady(config,invitationProvider)},invitationChannels:invitationReady(config,invitationProvider)?[...new Set(invitationProvider.channels)]:[],invitationLimit:20,restrictedBeta:true});
  if(path==='/auth/push/disable'){
   if(request.headers.has('origin')&&request.headers.get('origin')!==origin)return new Response('Origine non consentita',{status:403});
   return await pushRoutes({path,request,user:null,sessionHash:null,jsonBody});
  }
  if(path==='/auth/apple/notifications'){
   if(request.method!=='POST')return new Response('Metodo non consentito',{status:405});
   if(config.appleNotificationsEnabled!==true||config.appleBundleId!=='it.facciamobalotta.app')return Response.json({error:'Notifiche Apple non configurate.'},{status:503});
   const body=await jsonBody(request);let event;
   try{event=await verifyAppleNotification(body.payload,{audience:config.appleBundleId,providerFetch});}
   catch(error){return Response.json({error:'Notifica Apple non verificata.'},{status:error.status===503?503:401});}
   await store.applyAppleEvent(event);return Response.json({ok:true});
  }
  if(path==='/auth/apple/native/start'||path==='/auth/apple/native/exchange'){
   if(request.method!=='POST')return new Response('Metodo non consentito',{status:405});
   if(!appleReady())return Response.json({error:'Accesso Apple in preparazione.'},{status:503});
   const body=await jsonBody(request);
   if(path.endsWith('/start')){
    if(typeof body.challenge!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(body.challenge))return Response.json({error:'Richiesta non valida.'},{status:400});
    const attempt=random(),nonce=random();
    await store.putAttempt(hash(attempt),{provider:'apple',challenge:body.challenge,nonce,created:Date.now()});
    return Response.json({attempt,nonce});
   }
   if(typeof body.attempt!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(body.attempt)||typeof body.verifier!=='string'||!/^[A-Za-z0-9_-]{43,128}$/.test(body.verifier))return Response.json({error:'Richiesta non valida.'},{status:400});
   const attempt=await store.takeAttempt(hash(body.attempt));
   if(!attempt||attempt.provider!=='apple'||!Number.isSafeInteger(attempt.created)||Date.now()-attempt.created>300000||!equal(attempt.challenge,hash(body.verifier)))return Response.json({error:'Richiesta scaduta o non valida. Riprova ad accedere.'},{status:400});
   let identity;
   try{identity=await verifyAppleToken(body.identityToken,{audience:config.appleBundleId,nonce:attempt.nonce,providerFetch});}
   catch(error){return Response.json({error:error.status===503?'Accesso Apple temporaneamente non disponibile. Riprova.':'Identità Apple non verificata.'},{status:error.status===503?503:401});}
   const allowed=(config.allowedEmails||[]).map(s=>s.trim().toLowerCase());
   if(!allowed.includes(identity.email))return Response.json({error:'Questa beta è riservata alle persone invitate. Usa l’indirizzo associato all’invito, anche se è un indirizzo privato Apple.'},{status:401});
   const token=random();
   const authorizationTime=Math.min(identity.issuedAt,Math.floor(attempt.created/1000));
   if(!await store.putAppleIdentitySession(identity,hash(token),authorizationTime))return Response.json({error:'Accesso Apple revocato. Riprova con una nuova autorizzazione.'},{status:401});
   return Response.json({token});
  }
  const auth=path.match(/^\/auth\/(google|facebook)\/(start|callback)$/);
  if(auth) {
   const [,provider,action]=auth;
   if(request.method!=='GET') return new Response('Metodo non consentito',{status:405});
   if(!ready(provider)) return Response.json({error:'Accesso non ancora collegato. La demo illustrativa è disponibile.'},{status:503});
   const clientId=provider==='google'?config.googleId:config.facebookId;
   const secret=provider==='google'?config.googleSecret:config.facebookSecret;
   const redirectUri=origin+'/auth/'+provider+'/callback';
   if(action==='start') {
    const native=url.searchParams.get('platform')==='native'; const challenge=url.searchParams.get('challenge');
    if(native&&!/^[A-Za-z0-9_-]{43}$/.test(challenge||'')) return new Response('Challenge non valido',{status:400});
    const state=random(),proof=random(),verifier=random();
    (await store.putAttempt(hash(state),{provider,proof:hash(proof),verifier,native,challenge}));
    const authorize=new URL(provider==='google'?'https://accounts.google.com/o/oauth2/v2/auth':`https://www.facebook.com/${config.facebookVersion}/dialog/oauth`);
    const params={client_id:clientId,redirect_uri:redirectUri,response_type:'code',state,scope:provider==='google'?'openid email profile':'public_profile,email'};
    if(provider==='google') Object.assign(params,{code_challenge:hash(verifier),code_challenge_method:'S256',prompt:'select_account'});
    authorize.search=new URLSearchParams(params).toString();
    return new Response(null,{status:302,headers:{location:authorize.toString(),'set-cookie':cookie('balotta_oauth',proof,600)}});
   }
   const state=url.searchParams.get('state'); const attempt=state?(await store.takeAttempt(hash(state))):null;
   const proof=cookies(request).balotta_oauth;
   if(!attempt||attempt.provider!==provider||!proof||!equal(attempt.proof,hash(proof))) return new Response('Richiesta scaduta o non valida. Riprova ad accedere.',{status:400});
   if(url.searchParams.has('error')||!url.searchParams.get('code')) return new Response('Accesso annullato. Puoi tornare all’app.',{status:400});
   const tokenUrl=provider==='google'?'https://oauth2.googleapis.com/token':`https://graph.facebook.com/${config.facebookVersion}/oauth/access_token`;
   const tokenResponse=await providerFetch(tokenUrl,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:secret,redirect_uri:redirectUri,code:url.searchParams.get('code'),...(provider==='google'?{grant_type:'authorization_code',code_verifier:attempt.verifier}:{})}),signal:AbortSignal.timeout(10_000)});
   if(!tokenResponse.ok) return new Response('Il servizio di accesso non ha autorizzato la richiesta.',{status:502});
   const tokenData=await tokenResponse.json();
   if(typeof tokenData.access_token!=='string') return new Response('Risposta del servizio non valida',{status:502});
   const infoUrl=provider==='google'?'https://openidconnect.googleapis.com/v1/userinfo':`https://graph.facebook.com/${config.facebookVersion}/me?fields=id,name,email`;
   const infoResponse=await providerFetch(infoUrl,{headers:{authorization:'Bearer '+tokenData.access_token},signal:AbortSignal.timeout(10_000)});
   if(!infoResponse.ok) return new Response('Impossibile verificare il profilo',{status:502});
   const info=await infoResponse.json(); const subject=provider==='google'?info.sub:info.id;
   const email=typeof info.email==='string'?info.email.trim().toLowerCase():'';
   const allowed=(config.allowedEmails||[]).map(s=>s.trim().toLowerCase());
   if(typeof subject!=='string'||!subject||!email||!allowed.includes(email)||(provider==='google'&&info.email_verified!==true)) return new Response('Questa anteprima è riservata alle persone invitate. Contatta chi organizza il test.',{status:403});
   const user=(await store.upsertIdentity(provider,subject,email,typeof info.name==='string'?info.name.slice(0,100):''));
   if(attempt.native) {
    const code=random();(await store.putHandoff(hash(code),user.id,attempt.challenge));
    return new Response(null,{status:303,headers:{location:'facciamobalotta://auth?code='+code,'set-cookie':cookie('balotta_oauth','',0)}});
   }
   return sessionResponse(user);
  }
  if(path==='/auth/native/exchange'&&request.method==='POST') {
   const body=await jsonBody(request);
   if(typeof body.code!=='string'||typeof body.verifier!=='string'||!/^[A-Za-z0-9_-]{43,128}$/.test(body.verifier)) return new Response('Richiesta non valida',{status:400});
   const handoff=(await store.takeHandoff(hash(body.code)));
   if(!handoff||!equal(handoff.challenge,hash(body.verifier))) return new Response('Codice non valido o scaduto',{status:400});
   return sessionResponse({id:handoff.user_id},true);
  }
  if(path.startsWith('/api/')) {
   const bearer=request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
   const raw=bearer||cookies(request).balotta_session;
   const user=raw?(await store.getSession(hash(raw))):null;
   if(!user) return Response.json({error:'Accedi per continuare.'},{status:401});
   if(!['GET','HEAD'].includes(request.method)&&!bearer&&request.headers.get('origin')!==origin) return new Response('Origine non consentita',{status:403});
   if(path==='/api/community-capabilities'&&request.method==='GET')return Response.json({moderation:config.communityEnabled===true&&(config.moderatorEmails||[]).map(s=>s.trim().toLowerCase()).includes(user.email.toLowerCase())});
   const safetyAllowed=path.startsWith('/api/account')||path==='/api/logout'||path==='/api/session'||path.startsWith('/api/blocks')||path.startsWith('/api/moderation')||(request.method==='GET'&&(path==='/api/profile'||path==='/api/illustrated-profile'));
   if(!safetyAllowed&&store.community&&await store.community.isSuspended(user.id))return Response.json({error:'Account sospeso. Puoi consultare il profilo, uscire o cancellare l’account.'},{status:403});
   const social={path,request,user,jsonBody,sessionHash:hash(raw)};
   const invitationResponse=await invitationRoutes(social);if(invitationResponse)return invitationResponse;
   const pushResponse=await pushRoutes(social);if(pushResponse)return pushResponse;
   const notificationResponse=await notificationRoutes(social);if(notificationResponse)return notificationResponse;
   const peerImageResponse=await peerImageRoutes(social);if(peerImageResponse)return peerImageResponse;
   const communityResponse=await communityRoutes(social);if(communityResponse)return communityResponse;
   const groupResponse=await groupRoutes(social);if(groupResponse)return groupResponse;
   const matchingResponse=await matchingRoutes(social);if(matchingResponse)return matchingResponse;
   const meetingResponse=await meetingRoutes(social);if(meetingResponse)return meetingResponse;
   const imageResponse=await profileImages({path,request,user,jsonBody});if(imageResponse)return imageResponse;
   if(path==='/api/session'&&request.method==='GET') return Response.json({user});
   if(path==='/api/account/deletion-method'&&request.method==='GET'){
    const identity=await store.getIdentity(user.id);return Response.json({provider:identity.provider});
   }
   if((path==='/api/account/apple/start'||path==='/api/account/apple/delete')&&request.method==='POST'){
    const identity=await store.getIdentity(user.id);
    if(identity.provider!=='apple')return Response.json({error:'Metodo non disponibile per questo account.'},{status:400});
    if(!appleRevocationReady(config))return Response.json({error:'Revoca Apple non ancora configurata. Riprova più tardi.'},{status:503});
    const body=await jsonBody(request);
    if(path.endsWith('/start')){
     if(typeof body.challenge!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(body.challenge))return Response.json({error:'Richiesta non valida.'},{status:400});
     const attempt=random(),nonce=random();await store.putAttempt(hash(attempt),{provider:'apple-delete',userId:user.id,nonce,challenge:body.challenge,created:Date.now()});return Response.json({attempt,nonce});
    }
    if(typeof body.attempt!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(body.attempt)||typeof body.verifier!=='string'||!/^[A-Za-z0-9_-]{43,128}$/.test(body.verifier))return Response.json({error:'Richiesta non valida.'},{status:400});
    const attempt=await store.takeAttempt(hash(body.attempt));
    if(!attempt||attempt.provider!=='apple-delete'||attempt.userId!==user.id||Date.now()-attempt.created>300000||!equal(attempt.challenge,hash(body.verifier)))return Response.json({error:'Conferma scaduta o non valida. Riprova.'},{status:400});
    let confirmed;
    try{confirmed=await verifyAppleToken(body.identityToken,{audience:config.appleBundleId,nonce:attempt.nonce,providerFetch});}
    catch(error){return Response.json({error:'Conferma Apple non verificata.'},{status:error.status===503?503:401});}
    if(confirmed.subject!==identity.subject)return Response.json({error:'Conferma con lo stesso account Apple usato per accedere.'},{status:401});
    try{await revokeAppleAuthorization({config,code:body.authorizationCode,subject:identity.subject,nonce:attempt.nonce,providerFetch});}
    catch{return Response.json({error:'Impossibile completare la revoca Apple. Account ancora presente: riprova più tardi.'},{status:503});}
    await store.revokeAndDeleteAppleAccount(user.id,Date.now());return Response.json({ok:true},{headers:{'set-cookie':cookie('balotta_session','',0)}});
   }
   if(path==='/api/illustrated-profile'&&request.method==='GET') return Response.json((await store.getIllustratedProfile(user.id)));
   if(path==='/api/illustrated-profile'&&request.method==='PUT') {
    const body=await jsonBody(request,80_000);let draft;
    try {
     if(!Number.isSafeInteger(body.version)||body.version<0) throw new Error('Versione della bozza non valida.');
     draft=validateIllustratedDraft(body.draft);
    }catch(error){return Response.json({error:error.message},{status:400});}
    const saved=(await store.saveIllustratedProfile(user.id,draft,body.version));
    return saved?Response.json(saved):Response.json({error:'La bozza è stata aggiornata in un’altra sessione. Ricarica la versione salvata prima di riprovare.'},{status:409});
   }
   if(path==='/api/profile'&&request.method==='GET') return Response.json({profile:(await store.getProfile(user.id))});
   if(path==='/api/profile'&&request.method==='PUT') {
    const body=await jsonBody(request);
    if(typeof body.name!=='string'||body.name.trim().length<1||body.name.length>50||body.adult!==true||!cities.has(body.city)||!Array.isArray(body.interests)||body.interests.length>15||body.interests.some(i=>typeof i!=='string'||i.length>50)) return Response.json({error:'Controlla nome, maggiore età, provincia e interessi.'},{status:400});
    const profile={name:body.name.trim(),adult:true,city:body.city,interests:[...new Set(body.interests)]};
    (await store.saveProfile(user.id,profile)); return Response.json({profile});
   }
   if(path==='/api/logout'&&request.method==='POST') {(await store.dropSession(hash(raw)));return Response.json({ok:true},{headers:{'set-cookie':cookie('balotta_session','',0)}});}
   if(path==='/api/account'&&request.method==='DELETE') {if((await store.getIdentity(user.id)).provider==='apple')return Response.json({error:'Conferma prima la cancellazione con Apple nell’app iOS.'},{status:409});(await store.deleteAccount(user.id));return Response.json({ok:true},{headers:{'set-cookie':cookie('balotta_session','',0)}});}
  }
  return new Response('Non trovato',{status:404});
 }
 return async request=>{
  let response;
  try {response=await route(request);} catch(error) {
   response=Response.json({error:error instanceof SyntaxError||error.message==='payload'?'Richiesta non valida.':'Il servizio non è disponibile. Riprova più tardi.'},{status:error instanceof SyntaxError||error.message==='payload'?400:500});
  }
  const headers=new Headers(response.headers); headers.set('cache-control','no-store');headers.set('x-content-type-options','nosniff');headers.set('referrer-policy','no-referrer');
  const reqOrigin=request.headers.get('origin');
  if(reqOrigin===origin) {headers.set('access-control-allow-origin',origin);headers.set('access-control-allow-credentials','true');headers.set('vary','Origin');}
  return new Response(response.body,{status:response.status,headers});
 };
}
