import {generateKeyPairSync,sign} from 'node:crypto';
const rsa=generateKeyPairSync('rsa',{modulusLength:2048}),ec=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
export const appleFixture={jwk:{...rsa.publicKey.export({format:'jwk'}),kid:'fixture-key',alg:'RS256',use:'sig'},privatePem:ec.privateKey.export({format:'pem',type:'pkcs8'}),clientPublicKey:ec.publicKey};
export function appleJWT(claims,header={}){const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url'),input=encode({alg:'RS256',kid:'fixture-key',...header})+'.'+encode({iss:'https://appleid.apple.com',aud:'it.facciamobalotta.app',iat:Math.floor(Date.now()/1000),...claims});return input+'.'+sign('RSA-SHA256',Buffer.from(input),rsa.privateKey).toString('base64url');}
export function appleIdentity(nonce,claims={}){return appleJWT({exp:Math.floor(Date.now()/1000)+600,sub:'apple-owner',email:'tester@example.com',email_verified:true,nonce,...claims});}
