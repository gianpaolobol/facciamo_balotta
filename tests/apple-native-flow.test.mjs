import test from 'node:test';import assert from 'node:assert/strict';
import {authenticateWithApple} from '../src/apple-native-flow.mjs';
import * as flow from '../src/apple-native-flow.mjs';
const attempt='a'.repeat(43),nonce='n'.repeat(43),session='s'.repeat(43);
function harness(credential={state:attempt,identityToken:'signed-token'},reply={token:session}){
 const calls=[],saved=[];
 return {calls,saved,run:()=>authenticateWithApple({
  createProof:async()=>({verifier:'v'.repeat(64),challenge:'c'.repeat(43)}),
  request:async(path,method,body)=>{calls.push({path,method,body});return path.endsWith('/start')?{attempt,nonce}:reply;},
  authorize:async options=>{assert.deepEqual(options,{state:attempt,nonce});return credential;},
  persistSession:async value=>saved.push(value)
 })};
}
test('Apple native flow binds the credential to the requested state before storing a session',async()=>{
 const h=harness();await h.run();assert.deepEqual(h.saved,[session]);assert.equal(h.calls.length,2);assert.equal(h.calls[0].body.challenge,'c'.repeat(43));assert.deepEqual(h.calls[1],{path:'/auth/apple/native/exchange',method:'POST',body:{attempt,verifier:'v'.repeat(64),identityToken:'signed-token'}});
});
test('native Apple flow does not exchange an absent token or mismatched state',async()=>{
 for(const credential of [{state:'wrong',identityToken:'signed-token'},{state:attempt,identityToken:null},{state:null,identityToken:'signed-token'}]){const h=harness(credential);await assert.rejects(h.run);assert.equal(h.calls.length,1);assert.deepEqual(h.saved,[]);}
});
test('native Apple flow never stores a malformed backend session',async()=>{
 const h=harness(undefined,{token:'invalid'});await assert.rejects(h.run);assert.deepEqual(h.saved,[]);
});
test('native Apple deletion requires a fresh authorization code and a confirmed backend deletion',async()=>{
 const calls=[];await flow.reauthenticateAndDeleteAppleAccount({createProof:async()=>({verifier:'v'.repeat(64),challenge:'c'.repeat(43)}),authorize:async options=>({state:options.state,identityToken:'signed-token',authorizationCode:'fresh-code'}),request:async(path,method,body)=>{calls.push({path,method,body});return path.endsWith('/start')?{attempt,nonce}:{ok:true};}});
 assert.deepEqual(calls[1],{path:'/api/account/apple/delete',method:'POST',body:{attempt,verifier:'v'.repeat(64),identityToken:'signed-token',authorizationCode:'fresh-code'}});
});
test('native Apple deletion without an authorization code never reaches the delete endpoint',async()=>{
 let requests=0;await assert.rejects(()=>flow.reauthenticateAndDeleteAppleAccount({createProof:async()=>({verifier:'v'.repeat(64),challenge:'c'.repeat(43)}),authorize:async()=>({state:attempt,identityToken:'signed-token',authorizationCode:null}),request:async()=>{requests++;return {attempt,nonce};}}));assert.equal(requests,1);
});
