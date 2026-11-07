// Local QA with fictitious contacts: no provider, address book or API request.
import http from 'node:http';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {resolve,extname} from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const root=resolve(process.env.INVITATIONS_WEB_DIR||'dist-invitations');
const server=http.createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));if(!file.startsWith(root+'/'))throw Error();res.setHeader('content-type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.ttf':'font/ttf','.jpg':'image/jpeg','.png':'image/png'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],apiRequests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))apiRequests.push(r.url());});
 await page.goto(`http://127.0.0.1:${server.address().port}/?demoScreen=app`);await page.getByRole('tab').filter({hasText:'Profilo'}).click();
 await page.getByRole('button',{name:'Seleziona tutti',exact:true}).click();await page.getByText('3 contatti selezionati',{exact:true}).waitFor();
 await page.getByRole('checkbox',{name:'Invita Luca · esempio',exact:true}).uncheck();await page.getByText('2 contatti selezionati',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Anteprima dell’invito',exact:true}).click();
 const note=page.getByText('L’invito non include il tuo profilo Balotta. WhatsApp, SMS ed email mostrano il mittente.',{exact:true});assert.equal(await note.count(),2);assert.equal(await note.first().evaluate(el=>getComputedStyle(el).fontSize),'12px');
 await page.getByRole('button',{name:'Simula invito a tutti i selezionati (2)',exact:true}).click();await page.getByText('Simulazione completata per 2 nomi fittizi. Nessuna rubrica letta e nessun messaggio inviato.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Continua senza invitare',exact:true}).click();await page.getByText('0 contatti selezionati',{exact:true}).waitFor();
 assert.equal(await page.getByRole('checkbox').filter({hasText:/@|\+39333/}).count(),0);for(const name of ['WhatsApp','Messaggio','Email'])assert.equal(await page.getByRole('button',{name,exact:true}).count(),1);assert.equal(await page.getByRole('textbox',{name:'Email o telefono del contatto',exact:true}).count(),0);assert.equal(apiRequests.length,0);assert.deepEqual(errors,[]);console.log('PASS: mobile390, select all, unselect one, exact small personal-sender note, preview, simulate all selected, optional skip; zero API/provider calls.');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
