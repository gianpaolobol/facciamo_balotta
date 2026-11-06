import {createNodeServer} from './http.mjs';
import { createStore } from './store.mjs';
import { createApp } from './auth.mjs';

const origin=process.env.PUBLIC_ORIGIN||'http://localhost:8787';
if(process.env.OAUTH_ENABLED==='true'&&!origin.startsWith('https://')) throw new Error('OAuth reale richiede un PUBLIC_ORIGIN HTTPS.');
const store=createStore(process.env.DATABASE_PATH||'./balotta.sqlite');
const app=createApp({store,config:{origin,enabled:process.env.OAUTH_ENABLED==='true',googleId:process.env.GOOGLE_CLIENT_ID,googleSecret:process.env.GOOGLE_CLIENT_SECRET,facebookId:process.env.FACEBOOK_APP_ID,facebookSecret:process.env.FACEBOOK_APP_SECRET,facebookVersion:process.env.FACEBOOK_API_VERSION,allowedEmails:(process.env.BETA_ALLOWED_EMAILS||'').split(',').filter(Boolean)}});
// Apply a per-visitor rate limit at the trusted reverse proxy. A loopback-IP
// limiter here would share one quota across all visitors and allow a global DoS.
const server=createNodeServer(app);
server.listen(Number(process.env.PORT||8787),'127.0.0.1',()=>console.log('Balotta API pronta; login reale attivo: '+(process.env.OAUTH_ENABLED==='true')));
process.on('SIGTERM',()=>server.close(()=>{store.close();process.exit(0);}));
