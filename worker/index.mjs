import {createApp} from '../server/auth.mjs';
import {createD1Store} from '../server/d1-store.mjs';
import {dispatchPush} from '../server/push-dispatch.mjs';
import {pushReady} from '../server/push.mjs';
import {createBoundImageProvider} from './image-binding.mjs';
const pushConfig=env=>({pushEnabled:env.PUSH_ENABLED==='true',pushProjectId:env.PUSH_PROJECT_ID,pushEncryptionKey:env.PUSH_ENCRYPTION_KEY,expoAccessToken:env.EXPO_ACCESS_TOKEN});
export default {async scheduled(_event,env,ctx){
 const config=pushConfig(env);if(!pushReady(config)||!env.DB)return;
 // No cron trigger is configured in the repository. Activation requires device tests.
 ctx.waitUntil(dispatchPush({store:createD1Store(env.DB),config}));
},async fetch(request,env){
 let origin;try{origin=new URL(env.PUBLIC_ORIGIN);if(origin.protocol!=='https:'||origin.hostname.endsWith('.invalid'))throw Error();}catch{return Response.json({error:'Backend non ancora configurato.'},{status:503,headers:{'cache-control':'no-store'}});}
 if(!env.DB)return Response.json({error:'Database non configurato.'},{status:503,headers:{'cache-control':'no-store'}});
 if(!['GET','HEAD'].includes(request.method)){
  const limit=request.method==='PUT'&&new URL(request.url).pathname==='/api/illustrated-profile'?80000:16384;
  if(Number(request.headers.get('content-length'))>limit)return new Response('Richiesta troppo grande.',{status:413});
  const reader=request.body?.getReader();let size=0;const chunks=[];
  if(reader)while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();return new Response('Richiesta troppo grande.',{status:413});}chunks.push(value);}
  const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}request=new Request(request,{body});
 }
 const store=createD1Store(env.DB),imageProvider=createBoundImageProvider(env);
 return createApp({store,imageProvider,config:{origin:origin.origin,invitationsEnabled:env.INVITATIONS_ENABLED==='true',invitationUrl:env.INVITATION_URL,invitationHashKey64hex:env.INVITATION_HASH_KEY64HEX,...pushConfig(env),enabled:env.OAUTH_ENABLED==='true',meetingsEnabled:env.MEETINGS_ENABLED==='true',matchingEnabled:env.MATCHING_ENABLED==='true',groupsEnabled:env.GROUPS_ENABLED==='true',communityEnabled:env.COMMUNITY_ENABLED==='true',notificationsEnabled:env.NOTIFICATIONS_ENABLED==='true',moderatorEmails:(env.MODERATOR_EMAILS||'').split(',').filter(Boolean),appleNativeEnabled:env.APPLE_NATIVE_ENABLED==='true',appleBundleId:env.APPLE_BUNDLE_ID,appleNotificationsEnabled:env.APPLE_NOTIFICATIONS_ENABLED==='true',appleTeamId:env.APPLE_TEAM_ID,appleKeyId:env.APPLE_KEY_ID,applePrivateKey:env.APPLE_PRIVATE_KEY,googleId:env.GOOGLE_CLIENT_ID,googleSecret:env.GOOGLE_CLIENT_SECRET,facebookId:env.FACEBOOK_APP_ID,facebookSecret:env.FACEBOOK_APP_SECRET,facebookVersion:env.FACEBOOK_API_VERSION,allowedEmails:(env.BETA_ALLOWED_EMAILS||'').split(',').filter(Boolean)}})(request);
}};
