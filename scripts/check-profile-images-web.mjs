// Local UI integration check only. Uses a synthetic session and pixel fixture, never the real AI provider.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
import {createNodeServer} from '../server/http.mjs';
import {createApp} from '../server/auth.mjs';
import {createStore} from '../server/store.mjs';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const origin='http://127.0.0.1:8766',root=resolve(process.env.PROFILE_WEB_DIR||'dist-test');
const store=createStore(':memory:'),token='q'.repeat(43);const user=store.upsertIdentity('google','qa','qa@example.com','Ada');
store.putSession(createHash('sha256').update(token).digest('base64url'),user.id);
const pending=[];
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jw1sAAAAASUVORK5CYII=','base64');
const imageProvider={ready:true,accountId:'a'.repeat(32),model:'offline-ui-fixture',generate:()=>new Promise((resolve,reject)=>pending.push({resolve:()=>resolve({bytes:png,mime:'image/png',model:'offline-ui-fixture',styleVersion:'balotta-ink-1'}),reject}))};
store.saveProfile(user.id,{name:'Ada',adult:true,city:'Bologna',interests:[]});
store.saveIllustratedProfile(user.id,{fields:{portrait:'Adulto con capelli corti','interest-1':'','interest-2':'','interest-3':'','interest-4':'','interest-5':''},confirmed:{portrait:'Adulto con capelli corti'}},0);
const app=createApp({store,config:{origin},imageProvider});const calls=[];
const server=createNodeServer(async req=>{
 const path=new URL(req.url).pathname;if(path.startsWith('/api/')||path.startsWith('/auth/')){calls.push({path,method:req.method,...(req.method==='PUT'?{body:await req.clone().json()}:{} )});return app(req);}
 const file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));if(!file.startsWith(root+'/'))return new Response('',{status:403});
 try{return new Response(await readFile(file),{headers:{'content-type':({'.html':'text/html','.js':'application/javascript','.css':'text/css','.ttf':'font/ttf','.jpg':'image/jpeg'})[extname(file)]||'application/octet-stream'}});}catch{return new Response('',{status:404});}
});
await new Promise(r=>server.listen(8766,'127.0.0.1',r));
let browser;try{
 browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage'],headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844}});await context.addCookies([{name:'balotta_session',value:token,url:origin}]);const page=await context.newPage();
 await page.goto(origin);await page.getByRole('button',{name:'Prepara le descrizioni',exact:true}).click();
 const generate=page.getByRole('button',{name:'Genera il ritratto',exact:true});await generate.click();await page.getByRole('button',{name:'Elaborazione…',exact:true}).waitFor();
 const closingEnabled=await page.getByRole('button',{name:'Chiudi le descrizioni',exact:true}).isEnabled();
 for(let i=0;i<100&&!pending.length;i++)await new Promise(r=>setTimeout(r,10));assert.ok(pending.length);pending.shift().resolve();
 await page.getByRole('img',{name:'Anteprima da approvare'}).waitFor();
 const discardCount=await page.getByRole('button',{name:'Scarta questa anteprima',exact:true}).count();
 console.log(JSON.stringify({closingEnabled,discardCount,fixture:'offline-ui-fixture; not a real generated image'}));
 assert.equal(closingEnabled,false);assert.equal(discardCount,1);
 await page.getByRole('button',{name:'Scarta questa anteprima',exact:true}).click();await generate.waitFor();assert.equal(await page.getByRole('img',{name:'Anteprima da approvare'}).count(),0);
 await generate.click();for(let i=0;i<100&&!pending.length;i++)await new Promise(r=>setTimeout(r,10));pending.shift().resolve();await page.getByRole('button',{name:'Approva questa immagine',exact:true}).click();await page.getByText('Immagine approvata.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Rigenera questa immagine',exact:true}).click();for(let i=0;i<100&&!pending.length;i++)await new Promise(r=>setTimeout(r,10));pending.shift().reject(Error('offline failure'));
 await page.getByRole('alert').filter({hasText:'Generazione non disponibile.'}).waitFor();assert.equal(await page.getByRole('img',{name:'Immagine approvata'}).count(),1);
 console.log('PASS: generate, discard first preview, approve, failed regeneration keeps approved image; no provider network call.');
}finally{for(const job of pending)job.reject(Error('test cleanup'));await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));store.close();}
