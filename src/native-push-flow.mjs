// No Expo dependencies: all side effects are supplied by the native adapter.
const KEY='balotta.push.installation.v1';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function createNativePushFlow(deps) {
 let request=deps.request,epoch=0,accountId=null,record,initializing,queue=Promise.resolve();
 let state={accountId:null,enabled:false,pendingDisable:false,busy:false};
 const listeners=new Set();
 const publish=patch=>{state={...state,...patch};for(const fn of listeners)fn(state);};
 const current=(version,owner)=>epoch===version&&accountId===owner;
 const serial=operation=>{const next=queue.then(operation);queue=next.catch(()=>{});return next;};
 async function load(){
  if(!initializing)initializing=(async()=>{const raw=await deps.storage.get(KEY);record=raw?JSON.parse(raw):null;
   if(record&&(!UUID.test(record.installationId)||!/^[0-9a-f]{64}$/i.test(record.installationSecret)))throw new Error('Dati del dispositivo non validi. Riprova dopo aver reinstallato l’app.');
  })();
  await initializing;
 }
 async function save(){await deps.storage.set(KEY,JSON.stringify(record));}
 async function revoke(){
  await load();
  if(!record?.owner&&!record?.pendingDisable){publish({enabled:false,pendingDisable:false});return;}
  record={...record,opted:false,pendingDisable:true};publish({enabled:false,pendingDisable:true});await save();
  await request('/auth/push/disable','POST',{installationId:record.installationId,installationSecret:record.installationSecret});
  record={...record,owner:null,opted:false,pendingDisable:false};await save();publish({enabled:false,pendingDisable:false});
 }
 return {
  snapshot:()=>state,
  subscribe(listener){listeners.add(listener);return()=>{listeners.delete(listener);};},
  setRequester(next){request=next;},
  async setAccount(owner){
   // The permission dialog returning to foreground must not cancel its own consent.
   if(accountId===owner&&state.busy)return;
   accountId=owner;const version=++epoch;publish({accountId:owner,enabled:false,busy:true});
   try{await serial(async()=>{
    await load();if(!current(version,owner))return;
    if(record?.pendingDisable||(record?.owner&&record.owner!==owner))await revoke();
    if(!current(version,owner)||!owner)return;
    const result=await request('/api/push/device','GET');
    if(!current(version,owner))return;
    const permission=await deps.getPermission();
    if(!current(version,owner))return;
    if(record?.owner===owner&&record.opted&&!permission.granted){await revoke();return;}
    publish({enabled:result.enabled===true&&record?.owner===owner&&record.opted===true&&permission.granted===true,pendingDisable:false});
   });}catch(error){if(current(version,owner))throw error;}
   finally{if(current(version,owner))publish({busy:false});}
  },
  async enable(){
   const owner=accountId,version=epoch;
   if(!owner||state.busy)return;
   publish({busy:true});
   try{
    if(!deps.isSupported())throw new Error('Le notifiche richiedono un telefono fisico e una build di sviluppo o distribuzione; Expo Go non è supportato.');
    if(!UUID.test(deps.projectId||''))throw new Error('Il progetto EAS delle notifiche non è configurato.');
    await serial(async()=>{await load();if(record?.pendingDisable)await revoke();});
    if(!current(version,owner))return;
    let permission=await deps.getPermission();
    if(!current(version,owner))return;
    if(!permission.granted&&permission.canAskAgain!==false)permission=await deps.requestPermission();
    if(!current(version,owner))return;
    if(!permission.granted)throw new Error('Notifiche non consentite. Puoi abilitarle nelle impostazioni del telefono e riprovare.');
    const token=await deps.getToken();
    if(!current(version,owner))return;
    await serial(async()=>{
     if(!current(version,owner))return;
     if(!record){record={...await deps.createProof(),owner:null,opted:false,pendingDisable:false};await save();}
     if(!current(version,owner))return;
     // Save a pending revocation before sending: lost responses remain safely retryable.
     record={...record,owner,opted:false,pendingDisable:true};await save();
     if(!current(version,owner))return;
     await request('/api/push/device','POST',{installationId:record.installationId,installationSecret:record.installationSecret,token,projectId:deps.projectId});
     if(!current(version,owner))return;
     record={...record,opted:true,pendingDisable:false};await save();
     if(current(version,owner))publish({enabled:true,pendingDisable:false});
    });
   }catch(error){
    if(current(version,owner)){publish({enabled:false,pendingDisable:record?.pendingDisable===true});throw error;}
   }finally{if(current(version,owner))publish({busy:false});}
  },
  async detach(owner){
   if(accountId!==owner)return;
   ++epoch;publish({busy:false});
   await serial(async()=>{await load();if(record?.pendingDisable)await revoke();});
  },
  async disable(){
   ++epoch;publish({enabled:false,pendingDisable:true,busy:true});
   const version=epoch;
   try{await serial(revoke);}finally{if(epoch===version)publish({busy:false});}
  },
 };
}
