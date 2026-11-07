import {createNodeServer} from './http.mjs';
import {createFreeImageProvider} from './image-provider.mjs';
import { createStore } from './store.mjs';
import { createApp } from './auth.mjs';

const origin=process.env.PUBLIC_ORIGIN||'http://localhost:8787';
if(process.env.OAUTH_ENABLED==='true'&&!origin.startsWith('https://')) throw new Error('OAuth reale richiede un PUBLIC_ORIGIN HTTPS.');
const store=createStore(process.env.DATABASE_PATH||'./balotta.sqlite');
const imageProvider=createFreeImageProvider({accountId:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CLOUDFLARE_API_TOKEN,freePlanConfirmed:process.env.CLOUDFLARE_FREE_PLAN_CONFIRMED==='true'});
const app=createApp({store,imageProvider,config:{origin,pushEnabled:process.env.PUSH_ENABLED==='true',pushProjectId:process.env.PUSH_PROJECT_ID,pushEncryptionKey:process.env.PUSH_ENCRYPTION_KEY,expoAccessToken:process.env.EXPO_ACCESS_TOKEN,enabled:process.env.OAUTH_ENABLED==='true',meetingsEnabled:process.env.MEETINGS_ENABLED==='true',matchingEnabled:process.env.MATCHING_ENABLED==='true',groupsEnabled:process.env.GROUPS_ENABLED==='true',communityEnabled:process.env.COMMUNITY_ENABLED==='true',notificationsEnabled:process.env.NOTIFICATIONS_ENABLED==='true',moderatorEmails:(process.env.MODERATOR_EMAILS||'').split(',').filter(Boolean),appleNativeEnabled:process.env.APPLE_NATIVE_ENABLED==='true',appleBundleId:process.env.APPLE_BUNDLE_ID,appleNotificationsEnabled:process.env.APPLE_NOTIFICATIONS_ENABLED==='true',appleTeamId:process.env.APPLE_TEAM_ID,appleKeyId:process.env.APPLE_KEY_ID,applePrivateKey:process.env.APPLE_PRIVATE_KEY,googleId:process.env.GOOGLE_CLIENT_ID,googleSecret:process.env.GOOGLE_CLIENT_SECRET,facebookId:process.env.FACEBOOK_APP_ID,facebookSecret:process.env.FACEBOOK_APP_SECRET,facebookVersion:process.env.FACEBOOK_API_VERSION,allowedEmails:(process.env.BETA_ALLOWED_EMAILS||'').split(',').filter(Boolean)}});
// Apply a per-visitor rate limit at the trusted reverse proxy. A loopback-IP
// limiter here would share one quota across all visitors and allow a global DoS.
const server=createNodeServer(app);
server.listen(Number(process.env.PORT||8787),'127.0.0.1',()=>console.log('Balotta API pronta; login reale attivo: '+(process.env.OAUTH_ENABLED==='true')));
process.on('SIGTERM',()=>server.close(()=>{store.close();process.exit(0);}));
