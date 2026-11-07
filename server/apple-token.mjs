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
export async function verifyAppleToken(token,{audience,nonce,providerFetch=fetch,now=Math.floor(Date.now()/1000)}){
 let header,claims,parts;
 try{
  if(typeof token!=='string'||token.length>8000)throw Error();
  parts=token.split('.');if(parts.length!==3||parts.some(p=>!p||!/^[A-Za-z0-9_-]+$/.test(p)))throw Error();
  header=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
  claims=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));
  if(header?.alg!=='RS256'||typeof header.kid!=='string'||header.kid.length>128||header.crit!==undefined)throw Error();
  if(claims?.iss!=='https://appleid.apple.com'||claims.aud!==audience||typeof audience!=='string'||!audience)throw Error();
  if(!Number.isSafeInteger(claims.exp)||claims.exp<=now||!Number.isSafeInteger(claims.iat)||claims.iat>now+60||claims.iat<now-600||claims.exp<=claims.iat)throw Error();
  if(claims.nonce!==nonce||typeof nonce!=='string'||!nonce||typeof claims.sub!=='string'||!claims.sub||claims.sub.length>255)throw Error();
  if(typeof claims.email!=='string'||!claims.email||claims.email.length>320||!(claims.email_verified===true||claims.email_verified==='true'))throw Error();
 }catch{throw denied();}
 let keys;
 try{keys=await readKeys(await providerFetch(KEYS_URL,{signal:AbortSignal.timeout(10000),redirect:'error'}));}catch{throw unavailable();}
 const jwk=keys.find(key=>key?.kid===header.kid&&key.kty==='RSA'&&key.alg==='RS256'&&key.use==='sig');
 if(!jwk)throw denied();
 try{
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,Buffer.from(parts[2],'base64url'),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw Error();
 }catch{throw denied();}
 return {subject:claims.sub,email:claims.email.trim().toLowerCase()};
}
