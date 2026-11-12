import {verifyAppleToken} from './apple-token.mjs';
const unavailable=()=>Object.assign(new Error('Impossibile completare la revoca Apple. Riprova più tardi.'),{status:503});
export const appleRevocationReady=config=>config.appleBundleId==='it.facciamobalotta.app'&&/^[A-Z0-9]{10}$/.test(config.appleTeamId||'')&&/^[A-Z0-9]{10}$/.test(config.appleKeyId||'')&&typeof config.applePrivateKey==='string'&&config.applePrivateKey.includes('-----BEGIN PRIVATE KEY-----');
async function clientSecret(config){
 const now=Math.floor(Date.now()/1000),encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
 const head=encode({alg:'ES256',kid:config.appleKeyId}),claims=encode({iss:config.appleTeamId,iat:now,exp:now+600,aud:'https://appleid.apple.com',sub:config.appleBundleId}),input=head+'.'+claims;
 const der=Buffer.from(config.applePrivateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,''),'base64');
 const key=await crypto.subtle.importKey('pkcs8',der,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 return input+'.'+Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(input))).toString('base64url');
}
async function readTokenResponse(response){
 if(!response.ok||!response.body)throw unavailable();
 const reader=response.body.getReader(),chunks=[];let size=0;
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();throw unavailable();}chunks.push(value);}
 return JSON.parse(Buffer.concat(chunks.map(c=>Buffer.from(c))).toString('utf8'));
}
export async function revokeAppleAuthorization({config,code,subject,nonce,providerFetch=fetch}){
 if(!appleRevocationReady(config)||typeof code!=='string'||!code||code.length>2048)throw unavailable();
 try{
  const secret=await clientSecret(config),post=(path,fields)=>providerFetch('https://appleid.apple.com/auth/'+path,{method:'POST',redirect:'manual',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:config.appleBundleId,client_secret:secret,...fields}),signal:AbortSignal.timeout(10000)});
  const data=await readTokenResponse(await post('token',{grant_type:'authorization_code',code}));
  const identity=await verifyAppleToken(data.id_token,{audience:config.appleBundleId,nonce,providerFetch});
  if(identity.subject!==subject||typeof data.refresh_token!=='string'||!data.refresh_token||data.refresh_token.length>4096)throw unavailable();
  const result=await post('revoke',{token:data.refresh_token,token_type_hint:'refresh_token'});
  if(!result.ok)throw unavailable();
  await result.body?.cancel();
 }catch{throw unavailable();}
}
