import assert from 'node:assert/strict';
import {test} from 'node:test';
import {verifyAppleToken} from '../server/apple-token.mjs';

test('Apple key lookup uses Cloudflare-compatible redirect handling and rejects redirects', async () => {
 const now=Math.floor(Date.now()/1000);
 const audience='it.facciamobalotta.app';
 const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
 const token=encode({alg:'RS256',kid:'test'})+'.'+encode({iss:'https://appleid.apple.com',aud:audience,iat:now,exp:now+300})+'.AA';
 let mode;
 await assert.rejects(verifyAppleToken(token,{audience,now,providerFetch:async(url,options)=>{
  assert.equal(url,'https://appleid.apple.com/auth/keys');
  mode=options.redirect;
  return Response.redirect('https://example.invalid/keys');
 }}),{status:503});
 assert.equal(mode,'manual');
});
