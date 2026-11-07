const KEYS_URL='https://appleid.apple.com/auth/keys';
const denied=()=>Object.assign(new Error('Identità Apple non verificata.'),{status:401});
const unavailable=()=>Object.assign(new Error('Accesso Apple temporaneamente non disponibile.'),{status:503});

async function readKeys(response){
 if(!response.ok||!response.body)throw unavailable();
 const reader=response.body.getReader(),chunks=[];let size=0;
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();throw unavailable();}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{const keys=JSON.parse(new TextDecoder().decode(bytes)).keys;if(!Array.isArray(keys)||keys.length>32)throw Error();return keys;}catch{throw unavailable();}
}

// Only Apple's fixed HTTPS endpoint supplies keys. JWT headers cannot choose URLs.
async function verifyAppleClaims(token,{audience,providerFetch=fetch,now=Math.floor(Date.now()/1000),maxAge=600,requireExpiry=true}){
 let header,claims,parts;
 try{
  if(typeof token!=='string'||token.length>8000)throw Error();
  parts=token.split('.');if(parts.length!==3||parts.some(p=>!p||!/^[A-Za-z0-9_-]+$/.test(p)))throw Error();
  header=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
  claims=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));
  if(header?.alg!=='RS256'||typeof header.kid!=='string'||header.kid.length>128||header.crit!==undefined)throw Error();
  if(claims?.iss!=='https://appleid.apple.com'||claims.aud!==audience||typeof audience!=='string'||!audience)throw Error();
  if(!Number.isSafeInteger(claims.iat)||claims.iat>now+60||claims.iat<now-maxAge)throw Error();
  if((requireExpiry||claims.exp!==undefined)&&(!Number.isSafeInteger(claims.exp)||claims.exp<=now||claims.exp<=claims.iat))throw Error();
 }catch{throw denied();}
 let keys;
 try{keys=await readKeys(await providerFetch(KEYS_URL,{signal:AbortSignal.timeout(10000),redirect:'error'}));}catch{throw unavailable();}
 const jwk=keys.find(key=>key?.kid===header.kid&&key.kty==='RSA'&&key.alg==='RS256'&&key.use==='sig');
 if(!jwk)throw denied();
 try{
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,Buffer.from(parts[2],'base64url'),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw Error();
 }catch{throw denied();}
 return claims;
}
export async function verifyAppleToken(token,options){
 const claims=await verifyAppleClaims(token,options);
 if(claims.nonce!==options.nonce||typeof options.nonce!=='string'||!options.nonce||typeof claims.sub!=='string'||!claims.sub||claims.sub.length>255)throw denied();
 if(typeof claims.email!=='string'||!claims.email||claims.email.length>320||!(claims.email_verified===true||claims.email_verified==='true'))throw denied();
 return {subject:claims.sub,email:claims.email.trim().toLowerCase(),issuedAt:claims.iat};
}
export async function verifyAppleNotification(token,options){
 const claims=await verifyAppleClaims(token,{...options,maxAge:604800,requireExpiry:false});
 let event=claims.events;try{if(typeof event==='string')event=JSON.parse(event);}catch{throw denied();}
 const now=options.now??Math.floor(Date.now()/1000);
 if(typeof claims.jti!=='string'||!claims.jti||claims.jti.length>255||!event||Array.isArray(event)||typeof event.sub!=='string'||!event.sub||event.sub.length>255||!['email-enabled','email-disabled','consent-revoked','account-deleted'].includes(event.type))throw denied();
 if(!Number.isSafeInteger(event.event_time)||event.event_time<0)throw denied();
 const time=event.event_time>100000000000?Math.floor(event.event_time/1000):event.event_time;
 if(time>now+60)throw denied();
 return {id:claims.jti,subject:event.sub,type:event.type,eventTime:time*1000,expires:(claims.iat+691200)*1000};
}
