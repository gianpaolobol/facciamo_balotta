import http from 'node:http';
import {Readable} from 'node:stream';
export function createNodeServer(app) {
 return http.createServer(async(req,res)=>{
  try {
   const path=new URL(req.url,'http://api.internal').pathname;
   const maxBytes=req.method==='PUT'&&path==='/api/illustrated-profile'?80_000:16_384;
   const body=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>maxBytes){res.writeHead(413);res.end();return;}body.push(chunk);}
   const request=new Request('http://api.internal'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(body)}:{})});
   const response=await app(request);res.writeHead(response.status,Object.fromEntries(response.headers));
   if(response.body) Readable.fromWeb(response.body).pipe(res);else res.end();
  } catch {res.writeHead(500);res.end('Servizio non disponibile.');}
 });
}
