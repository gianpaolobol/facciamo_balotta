import test from 'node:test';import assert from 'node:assert/strict';
import {createNodeServer} from '../server/http.mjs';
test('visitors behind one proxy cannot exhaust a shared application quota',async()=>{
 const server=createNodeServer(async()=>Response.json({ok:true}));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try {
  const base='http://127.0.0.1:'+server.address().port;
  for(let i=0;i<120;i++) await fetch(base+'/api/config',{headers:{'x-real-ip':'192.0.2.1'}});
  const second=await fetch(base+'/api/config',{headers:{'x-real-ip':'192.0.2.2'}});assert.equal(second.status,200);
 } finally {await new Promise(r=>server.close(r));}
});
test('the HTTP adapter rejects an oversized body without sending it to the API',async()=>{
 let calls=0;const server=createNodeServer(async()=>{calls++;return Response.json({ok:true});});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try {const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/profile',{method:'PUT',body:'x'.repeat(17000)});assert.equal(response.status,413);assert.equal(calls,0);}finally{await new Promise(r=>server.close(r));}
});
test('illustrated draft transport accepts its bounded maximum and still rejects oversized bodies',async()=>{
 let received=0;const server=createNodeServer(async request=>{received=(await request.text()).length;return new Response('ok');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const url='http://127.0.0.1:'+server.address().port+'/api/illustrated-profile';
 assert.equal((await fetch(url,{method:'PUT',body:'a'.repeat(75000)})).status,200);assert.equal(received,75000);
 assert.equal((await fetch(url,{method:'PUT',body:'a'.repeat(80001)})).status,413);
 assert.equal((await fetch(url.replace('illustrated-profile','profile'),{method:'PUT',body:'a'.repeat(17000)})).status,413);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
