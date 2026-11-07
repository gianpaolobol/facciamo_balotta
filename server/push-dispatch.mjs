import {pushReady,decryptPushToken} from './push.mjs';
const SEND='https://exp.host/--/api/v2/push/send';
const RECEIPTS='https://exp.host/--/api/v2/push/getReceipts';
async function provider(fetchImpl,config,url,body){
 const controller=new AbortController();let timer;
 try{return await Promise.race([(async()=>{const response=await fetchImpl(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.expoAccessToken},body:JSON.stringify(body),signal:controller.signal,redirect:'error'});if(!response.ok)throw Error('Push provider unavailable');return response.json();})(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Push provider timeout'));},10000);})]);}finally{clearTimeout(timer);}
}
async function receiptChecks({store,config,fetchImpl,now}){
 for(const attempt of await store.push.receipts(now)){
  let receipt;try{const result=await provider(fetchImpl,config,RECEIPTS,{ids:[attempt.ticket_id]});receipt=result?.data?.[attempt.ticket_id];}catch{}
  if(receipt?.status==='ok')await store.push.receiptResult(attempt.id,'receipt_ok',now);
  else if(receipt?.status==='error'){
   if(receipt.details?.error==='DeviceNotRegistered')await store.push.revokeVersion(attempt.version);
   await store.push.receiptResult(attempt.id,'failed',now);
  }else await store.push.receiptResult(attempt.id,'ticket',now);
 }
}
export async function dispatchPush({store,config,fetchImpl=fetch,now}){
 if(!pushReady(config))return {attempted:0};
 // An explicit timestamp is a deterministic test clock. Production re-reads time
 // after receipt/network waits so an expired session cannot remain authorized.
 const time=()=>now===undefined?Date.now():now;
 await store.push.prune(time());await receiptChecks({store,config,fetchImpl,now:time()});let attempted=0;
 for(const device of await store.push.candidates(time())){
  if(attempted>=5)break;
  if(device.project_id!==config.pushProjectId)continue;
  const unread=(await store.notifications.list(device.user_id)).notifications.find(n=>!n.read&&n.id>device.cursor);
  if(!unread)continue;
  const attempt=await store.push.reserve(device,unread.id,time());if(!attempt)continue;attempted++;
  try{
   const token=await decryptPushToken(device.token_cipher,config.pushEncryptionKey);
   // Session is the final awaited check, after token decryption and current visibility.
   if(!(await store.notifications.list(device.user_id)).notifications.some(n=>n.id===unread.id&&!n.read)||!await store.push.current(device.version,time())){await store.push.finish(attempt.id,'failed',null,time());continue;}
   const result=await provider(fetchImpl,config,SEND,{to:token,title:'Facciamo Balotta',body:'Hai nuovi aggiornamenti nell’app.',data:{screen:'updates'},ttl:300,channelId:'updates'});
   const ticket=result?.data;
   if(ticket?.status==='ok'&&typeof ticket.id==='string'&&/^[a-zA-Z0-9_-]{1,200}$/.test(ticket.id))await store.push.finish(attempt.id,'ticket',ticket.id,time());
   else {if(ticket?.status==='error'&&ticket.details?.error==='DeviceNotRegistered')await store.push.revokeVersion(device.version);await store.push.finish(attempt.id,'failed',null,time());}
  }catch{await store.push.finish(attempt.id,'failed',null,time());}
 }
 return {attempted};
}
