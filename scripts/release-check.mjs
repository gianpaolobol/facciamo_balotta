import {readFileSync} from 'node:fs';
import {EAS_PROJECT_ID,EAS_OWNER} from '../config/distribution.mjs';
const required=['EXPO_PUBLIC_API_URL','PUBLIC_ORIGIN','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','FACEBOOK_APP_ID','FACEBOOK_APP_SECRET','FACEBOOK_API_VERSION','BETA_ALLOWED_EMAILS','APPLE_TEAM_ID','APPLE_KEY_ID','APPLE_PRIVATE_KEY','MODERATOR_EMAILS'];
const missing=required.filter(name=>!process.env[name]);
if(process.env.OAUTH_ENABLED!=='true') missing.push('OAUTH_ENABLED=true');
for(const name of ['MEETINGS_ENABLED','MATCHING_ENABLED','GROUPS_ENABLED','COMMUNITY_ENABLED','NOTIFICATIONS_ENABLED','CLOUDFLARE_FREE_PLAN_CONFIRMED'])if(process.env[name]!=='true')missing.push(name+'=true after live verification');
if(process.env.PUSH_ENABLED==='true')for(const name of ['PUSH_PROJECT_ID','PUSH_ENCRYPTION_KEY','EXPO_ACCESS_TOKEN'])if(!process.env[name])missing.push(name+' for enabled native push');
if(process.env.APPLE_NATIVE_ENABLED!=='true') missing.push('APPLE_NATIVE_ENABLED=true after Apple release checks');
if(process.env.APPLE_NOTIFICATIONS_ENABLED!=='true') missing.push('APPLE_NOTIFICATIONS_ENABLED=true after callback registration');
if(process.env.APPLE_BUNDLE_ID!=='it.facciamobalotta.app') missing.push('APPLE_BUNDLE_ID=it.facciamobalotta.app');
if(!process.env.PUBLIC_ORIGIN?.startsWith('https://')) missing.push('PUBLIC_ORIGIN HTTPS');
const eas=JSON.parse(readFileSync(new URL('../eas.json',import.meta.url),'utf8'));
if(!eas.submit.beta.ios?.ascAppId) missing.push('App Store Connect app ID');
// Apple revocation/capabilities, privacy/consent, real provider round-trips and native device tests
// remain human release checks even when environment variables are present.
const manual=['Apple capability and real native sign-in, fresh reauthentication/token exchange/revoke on account deletion','Apple registered HTTPS notifications and real credential revocation/session invalidation tests','OAuth real provider tests','privacy/consent and moderation readiness','signed iOS/Android binaries and actual device tests','real free-plan AI generation and approved visual style','real multi-account matching, groups, chat, moderation and in-app notifications','APNs/FCM credentials, Expo enhanced push security, signed-device consent/revoke/delivery receipts on both platforms before enabling a scheduler'];
console.log(JSON.stringify({ready:false,expoProject:{owner:EAS_OWNER,id:EAS_PROJECT_ID},missingConfiguration:missing,manualChecks:manual,optionalFeatures:{pushEnabled:process.env.PUSH_ENABLED==='true',personalInvitationLinkConfigured:Boolean(process.env.EXPO_PUBLIC_INVITATION_URL)}},null,2));
process.exitCode=1;
