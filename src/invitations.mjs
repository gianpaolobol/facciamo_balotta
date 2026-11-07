export const INVITE_PRIVACY_NOTE='L’invito non mostra la tua identità o il tuo profilo agli invitati.';
export const INVITE_INTRO='Invita i tuoi contatti per far crescere la nostra comunità: più persone, più possibilità di match.';
export const INVITE_MESSAGE='Scopri Facciamo Balotta: persone nuove, passioni comuni e cose belle da fare insieme.';
export const INVITE_LIMIT=20;
export function normalizeRecipient(value){
 if(!value||typeof value!=='object'||typeof value.address!=='string'||/[\r\n\x00-\x1f]/.test(value.address))throw Error('Contatto non valido.');
 let address=value.address.trim();
 if(value.channel==='email'){
  address=address.toLowerCase();
  if(address.length>254||!/^[-a-z0-9.!#$%&'*+/=?^_`{|}~]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(address)||address.split('@')[0].length>64||address.startsWith('.')||address.includes('..'))throw Error('Inserisci un indirizzo email valido.');
 }else if(value.channel==='phone'){
  address=address.replace(/[ ().-]/g,'').replace(/^00/,'+');
  if(!/^\+[1-9]\d{7,14}$/.test(address))throw Error('Inserisci un numero con prefisso internazionale, per esempio +39.');
 }else throw Error('Tipo di contatto non supportato.');
 return {channel:value.channel,address};
}
export function prepareRecipients(values){
 if(!Array.isArray(values)||!values.length||values.length>100)throw Error('Seleziona almeno un contatto.');
 const unique=new Map();for(const value of values){const recipient=normalizeRecipient(value);unique.set(recipient.channel+':'+recipient.address,recipient);}
 if(unique.size>INVITE_LIMIT)throw Error('Puoi selezionare fino a '+INVITE_LIMIT+' contatti per invio.');
 return [...unique.values()];
}
export function addInviteContact(contacts,{name='',address}){
 if(typeof name!=='string'||name.trim().length>60||typeof address!=='string')throw Error('Controlla nome e contatto.');
 const recipient=normalizeRecipient({channel:address.includes('@')?'email':'phone',address}),key=recipient.channel+':'+recipient.address;
 if(contacts.some(c=>c.key===key))throw Error('Questo contatto è già nell’elenco.');
 if(contacts.length>=INVITE_LIMIT)throw Error('Puoi aggiungere fino a '+INVITE_LIMIT+' contatti.');
 return [...contacts,{key,name:name.trim(),...recipient}];
}
export function selectedRecipients(contacts,keys){const selected=new Set(keys);return prepareRecipients(contacts.filter(c=>selected.has(c.key)).map(({channel,address})=>({channel,address})));}
export function createInviteFlow({request,newBatchId}){
 let busy=false,epoch=0,batch=null;
 return {
  setRequester(next){request=next;},
  reset(){epoch++;busy=false;batch=null;},
  async submit(values){
   if(busy)return null;
   const recipients=prepareRecipients(values).sort((a,b)=>(a.channel+a.address).localeCompare(b.channel+b.address)),fingerprint=JSON.stringify(recipients);
   if(batch?.fingerprint!==fingerprint)batch={fingerprint,id:newBatchId()};
   busy=true;const version=epoch;
   try{const result=await request('/api/invitations','POST',{batchId:batch.id,recipients,anonymityAcknowledged:true});return version===epoch?result:null;}
   catch(error){if(version===epoch)throw error;return null;}
   finally{if(version===epoch)busy=false;}
  }
 };
}
