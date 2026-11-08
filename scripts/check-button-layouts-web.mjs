// Synthetic demo-only visual QA. No real contacts, OAuth, AI or messages.
import http from 'node:http';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const root=resolve(process.env.BUTTON_WEB_DIR||'dist-button-qa'),out=resolve('artifacts/button-layouts');
await mkdir(out,{recursive:true});
const server=http.createServer(async(req,res)=>{try{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path.startsWith('/auth/')||path.startsWith('/api/')){res.setHeader('content-type','application/json');res.end(JSON.stringify(path==='/auth/providers'?{google:false,facebook:false,apple:false}:{user:null}));return;}
 const file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));
 if(!file.startsWith(root+'/'))throw Error('outside root');
 res.setHeader('content-type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.ttf':'font/ttf','.jpg':'image/jpeg','.png':'image/png'})[extname(file)]||'application/octet-stream');
 res.end(await readFile(file));
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const errors=[],results=[];
try{
 browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const origin=`http://127.0.0.1:${server.address().port}`;
 for(const width of [375,430]){
  const context=await browser.newContext({viewport:{width,height:932},deviceScaleFactor:2});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  async function capture(name,button){
   if(button)await button.scrollIntoViewIfNeeded();
   const violations=await page.getByRole('button').evaluateAll(elements=>elements.flatMap(el=>{
    const box=el.getBoundingClientRect();if(!box.width||!box.height||parseFloat(getComputedStyle(el).borderTopWidth)===0)return[];
    const errors=[],walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){if(!node.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(node);
     for(const r of range.getClientRects())if(r.width&&r.height&&(r.left<box.left-1||r.right>box.right+1||r.top<box.top-1||r.bottom>box.bottom+1))errors.push({label:el.textContent,textOutsideButton:true});}
    for(const svg of el.querySelectorAll('svg')){const r=svg.getBoundingClientRect();if(r.left<box.left-1||r.right>box.right+1||r.top<box.top-1||r.bottom>box.bottom+1)errors.push({label:el.textContent,graphicOutsideButton:true});}
    return errors;
   }));
   await page.screenshot({path:resolve(out,`${width}-${name}.png`)});
   assert.deepEqual(violations,[],`${width}/${name}: bordered button content must fit its hit area`);results.push({width,scene:name,geometry:'pass'});
  }
  await page.goto(origin);const enter=page.getByRole('button',{name:/^Dai, facciamo balotta!\s+↗$/});await enter.waitFor();await capture('welcome',enter);
  await page.getByRole('button',{name:'Accedi ↗',exact:true}).click();await page.getByText('La tua prima balotta',{exact:false}).waitFor();await capture('login',page.getByRole('button',{name:/^G\s+Continua con Google$/}));
  await page.getByRole('button',{name:'Chiudi finestra',exact:true}).click();await page.goto(origin+'/?demoScreen=app');
  const propose=page.getByRole('button',{name:/Proponi un.attività/});await propose.waitFor();await capture('discover',propose);await propose.click();await page.getByText('Facciamola, questa balotta.',{exact:true}).waitFor();await page.getByRole('button',{name:'Chiudi finestra',exact:true}).click();
  await page.getByRole('tab').filter({hasText:'Profilo'}).click();
  const select=page.getByRole('button',{name:'Seleziona tutti',exact:true});await select.waitFor();await capture('contacts-select',select);
  const preview=page.getByRole('button',{name:'Anteprima dell’invito',exact:true});await preview.scrollIntoViewIfNeeded();assert.equal(await preview.getAttribute('aria-disabled'),'true');await capture('contacts-disabled',preview);
  await select.click();await page.getByText('3 contatti selezionati',{exact:true}).waitFor();await preview.click();await page.getByRole('button',{name:'Simula invito a tutti i selezionati (3)',exact:true}).waitFor();await capture('contacts-preview',page.getByRole('button',{name:'Simula invito a tutti i selezionati (3)',exact:true}));
  await page.getByRole('button',{name:'Continua senza invitare',exact:true}).click();await page.getByText('0 contatti selezionati',{exact:true}).waitFor();
  await capture('profile-images',page.getByRole('button',{name:'Prepara le descrizioni',exact:true}));
  await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(resolve(out,'results.json'),JSON.stringify({platform:'web',nativeVisualVerification:false,errors,results},null,2)+'\n');console.log(`PASS: ${results.length} mobile demo screenshots; button geometry, disabled/select/preview/skip and activity opening; no page errors.`);
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
