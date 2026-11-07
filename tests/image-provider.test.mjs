import test from 'node:test';import assert from 'node:assert/strict';
import {createFreeImageProvider,buildProfileImagePrompt,MODEL} from '../server/image-provider.mjs';
const config={accountId:'a'.repeat(32),token:'test-token',freePlanConfirmed:true};
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jw1sAAAAASUVORK5CYII=';
test('free-only provider stays disabled without credentials or explicit Free plan verification',async()=>{
 for(const cfg of [{},{...config,token:''},{...config,freePlanConfirmed:false}]){let calls=0;const p=createFreeImageProvider(cfg,{providerFetch:async()=>{calls++;}});assert.equal(p.ready,false);await assert.rejects(()=>p.generate({slot:'portrait',description:'Persona adulta'}));assert.equal(calls,0);}
});
test('generation pins model, size, two project references and server token',async()=>{
 let request;const p=createFreeImageProvider(config,{providerFetch:async(url,init)=>{request={url,init};return Response.json({success:true,result:{image:png}});}});
 const result=await p.generate({slot:'portrait',description:'Capelli corti'});
 assert.equal(MODEL,'@cf/black-forest-labs/flux-2-klein-4b');assert.ok(request.url.endsWith('/ai/run/'+MODEL));assert.equal(request.init.headers.authorization,'Bearer test-token');assert.ok(request.init.body instanceof FormData);
 for(const name of ['input_image_0','input_image_1']){const ref=request.init.body.get(name);assert.ok(ref instanceof Blob);assert.ok(ref.size>1000);}
 assert.equal(request.init.body.get('width'),'1024');assert.equal(request.init.body.get('height'),'1024');assert.equal(result.mime,'image/png');assert.ok(result.bytes.length>0);
 assert.ok(!request.init.body.get('prompt').includes(config.token));
});
test('style brief fixes art direction and treats descriptions only as subject data',()=>{
 const prompt=buildProfileImagePrompt({slot:'interest-2',description:'Camminare con amici'});assert.match(prompt,/black ink/i);assert.match(prompt,/warm cream/i);assert.match(prompt,/No text/i);assert.match(prompt,/Camminare con amici/);assert.match(prompt,/image 0/i);
 assert.throws(()=>buildProfileImagePrompt({slot:'interest-6',description:'x'}));assert.throws(()=>buildProfileImagePrompt({slot:'portrait',description:'a'.repeat(1001)}));
});
test('quota failures never retry or fall back to a paid provider and do not expose upstream text',async()=>{
 let calls=0;const p=createFreeImageProvider(config,{providerFetch:async()=>{calls++;return new Response('secret upstream detail',{status:429});}});
 await assert.rejects(()=>p.generate({slot:'portrait',description:'Adulto'}),error=>error.status===429&&!error.message.includes('secret'));assert.equal(calls,1);
});
test('malformed provider responses cannot be stored as an image',async()=>{
 for(const result of [{image:'not an image'},{image:Buffer.from('<script>bad</script>').toString('base64')},{}]){const p=createFreeImageProvider(config,{providerFetch:async()=>Response.json({success:true,result})});await assert.rejects(()=>p.generate({slot:'portrait',description:'Adulto'}));}
});
