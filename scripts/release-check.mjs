import {readFileSync} from 'node:fs';
const required=['EXPO_PROJECT_ID','EXPO_PUBLIC_API_URL','PUBLIC_ORIGIN','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','FACEBOOK_APP_ID','FACEBOOK_APP_SECRET','FACEBOOK_API_VERSION','BETA_ALLOWED_EMAILS'];
const missing=required.filter(name=>!process.env[name]);
if(process.env.OAUTH_ENABLED!=='true') missing.push('OAUTH_ENABLED=true');
if(!process.env.PUBLIC_ORIGIN?.startsWith('https://')) missing.push('PUBLIC_ORIGIN HTTPS');
const eas=JSON.parse(readFileSync(new URL('../eas.json',import.meta.url),'utf8'));
if(!eas.submit.beta.ios?.ascAppId) missing.push('App Store Connect app ID');
// Apple auth, privacy/consent, actual provider round-trips and native device tests
// remain human release checks even when environment variables are present.
const manual=['Apple login implementation for iOS','OAuth real provider tests','privacy/consent and moderation readiness','signed iOS/Android binaries and actual device tests'];
console.log(JSON.stringify({ready:false,missingConfiguration:missing,manualChecks:manual},null,2));
process.exitCode=1;
