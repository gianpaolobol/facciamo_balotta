import {phoneContacts} from './phone-invitations.mjs';

// Pure orchestration. Native SDK operations are injected; no contacts leave this module.
class ContactFlowError extends Error {}
/** @returns {never} */
const fail=message=>{throw new ContactFlowError(message);};
const permitted=permission=>permission?.granted===true&&permission.accessPrivileges!=='none';
const ensureCurrent=isCurrent=>{if(!isCurrent())fail('Operazione annullata. Riapri gli inviti e riprova.');};
const strings=(items,key)=>(Array.isArray(items)?items:[]).map(item=>item?.[key]).filter(value=>typeof value==='string'&&value.trim()).map(value=>value.trim());

export function createContactAdapterFlow(deps) {
 const ensureSupported=()=>{if(!deps.supported)fail('La rubrica e gli inviti personali sono disponibili nell’app nativa sul telefono.');};
 const guarded=async(operation,isCurrent)=>{
  ensureCurrent(isCurrent);
  const result=await operation();
  ensureCurrent(isCurrent);
  return result;
 };
 async function loadContacts(isCurrent,allowRequest) {
   try {
    ensureSupported();
    let permission=await guarded(()=>deps.getPermission(),isCurrent);
    if(allowRequest&&!permitted(permission)&&permission.canAskAgain!==false)permission=await guarded(()=>deps.requestPermission(),isCurrent);
    if(!permitted(permission))fail('Accesso ai contatti non consentito. Puoi abilitarlo nelle impostazioni del telefono.');
    const contacts=[];
    let pageOffset=0;
    while(true) {
     const page=await guarded(()=>deps.getPage({fields:['name','phoneNumbers','emails'],pageSize:200,pageOffset}),isCurrent);
     const latestPermission=await guarded(()=>deps.getPermission(),isCurrent);
     if(!permitted(latestPermission))fail('Accesso ai contatti non consentito. Puoi abilitarlo nelle impostazioni del telefono.');
     if(permission.accessPrivileges!==latestPermission.accessPrivileges)fail('L’accesso alla rubrica è cambiato. Aggiorna i contatti e riprova.');
     permission=latestPermission;
     if(!Array.isArray(page?.data))fail('Lettura dei contatti non disponibile. Riprova.');
     page.data.forEach((contact,index)=>{
      const name=typeof contact?.name==='string'?contact.name.trim():'';
      if(name)contacts.push({id:typeof contact.id==='string'&&contact.id?contact.id:`contact-${pageOffset+index}`,name,phones:strings(contact.phoneNumbers,'number'),emails:strings(contact.emails,'email')});
     });
     if(!page.hasNextPage)break;
     // A malformed empty continuation must not spin indefinitely.
     if(!page.data.length)fail('Lettura dei contatti non disponibile. Riprova.');
     pageOffset+=page.data.length;
    }
    return {contacts,limited:permission.accessPrivileges==='limited'};
   }catch(error){
    if(error instanceof ContactFlowError)throw error;
    fail('Lettura dei contatti non disponibile. Verifica i permessi e riprova.');
   }
  }
 async function ensureRecipient(channel,address,isCurrent) {
  const snapshot=await loadContacts(isCurrent,false);
  ensureCurrent(isCurrent);
  const field=channel==='email'?'emails':'phones';
  if(!phoneContacts(snapshot.contacts).some(contact=>contact[field].includes(address)))fail('Il contatto non è più accessibile nella rubrica. Aggiorna i contatti e riprova.');
 }
 return {
  async hasPermission() {
   if(!deps.supported)return false;
   try{return permitted(await deps.getPermission());}catch{return false;}
  },
  readContacts:isCurrent=>loadContacts(isCurrent,true),
  refreshContacts:isCurrent=>loadContacts(isCurrent,false),
  async compose({channel,address,message},isCurrent=()=>true) {
   try {
    ensureSupported();ensureCurrent(isCurrent);
    if(!['whatsapp','sms','email'].includes(channel))fail('Canale di invito non disponibile.');
    const validAddress=typeof address==='string'&&(channel==='email'?/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(address):/^\+[1-9]\d{7,14}$/.test(address));
    if(!validAddress||typeof message!=='string'||!message.trim())fail('Recapito o testo dell’invito non valido.');
    if(channel==='whatsapp'){
     await ensureRecipient(channel,address,isCurrent);
     await guarded(()=>deps.openURL(`https://wa.me/${address.slice(1)}?text=${encodeURIComponent(message)}`),isCurrent);
     return {status:'opened'};
    }
    if(channel==='sms'){
     if(!await guarded(()=>deps.smsAvailable(),isCurrent))fail('Il composer SMS non è disponibile su questo telefono.');
     await ensureRecipient(channel,address,isCurrent);
     const result=await guarded(()=>deps.sendSMS([address],message),isCurrent);
     return {status:['sent','cancelled'].includes(result?.result)?result.result:'unknown'};
    }
    if(!await guarded(()=>deps.mailAvailable(),isCurrent))fail('Il composer email non è disponibile. Configura un account email sul telefono.');
    await ensureRecipient(channel,address,isCurrent);
    const result=await guarded(()=>deps.composeMail({recipients:[address],subject:'Un invito a Balotta',body:message,isHtml:false}),isCurrent);
    return {status:['sent','saved','cancelled'].includes(result?.status)?result.status:'unknown'};
   }catch(error){
    if(error instanceof ContactFlowError)throw error;
    fail('Apertura del canale di invito non disponibile. Riprova o scegli un altro canale.');
   }
  },
 };
}
