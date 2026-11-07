import React,{useEffect,useRef,useState} from 'react';
import {AppState,Pressable,Text,TextInput,View} from 'react-native';
import {Button,Chip,C,s} from './ui';
import {readContacts,refreshContacts,compose,invitationUrl,nativeContactsSupported} from './contact-invitations';
import {phoneContacts,contactQueue,createContactInviteQueue,createContactReadScope,personalInviteMessage,PERSONAL_INVITE_NOTE} from './phone-invitations.mjs';
import {INVITE_INTRO,INVITE_MESSAGE} from './invitations.mjs';
type Channel='whatsapp'|'sms'|'email';
type Contact={id:string;name:string;phones:string[];emails:string[]};
const examples=phoneContacts([{id:'ada',name:'Ada · esempio',phones:['+393331234567'],emails:['ada@example.test']},{id:'luca',name:'Luca · esempio',phones:['+393331234568'],emails:['luca@example.test']},{id:'bea',name:'Bea · esempio',phones:['+393331234569'],emails:['bea@example.test']}]) as Contact[];
const label=(channel:Channel)=>({whatsapp:'WhatsApp',sms:'Messaggio',email:'Email'}[channel]);
export function InviteContacts({userId}:{userId?:string}){
 const demo=!userId;
 const [contacts,setContacts]=useState<Contact[]>(demo?examples:[]),[selected,setSelected]=useState<string[]>([]),[channel,setChannel]=useState<Channel>('whatsapp'),[query,setQuery]=useState('');
 const [limited,setLimited]=useState(false),[preview,setPreview]=useState(false),[busy,setBusy]=useState(false),[checking,setChecking]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const channelRef=useRef(channel);channelRef.current=channel;
 const alive=useRef(false),epoch=useRef(0),working=useRef(false),requested=useRef(false),operation=useRef<string|null>(null),readScope=useRef(createContactReadScope()),flow=useRef(createContactInviteQueue({compose}));
 const [progress,setProgress]=useState(flow.current.snapshot());
 const clear=()=>{flow.current.reset();setProgress(flow.current.snapshot());setSelected([]);setPreview(false);setMessage('');setError('');};
 useEffect(()=>{
  alive.current=true;epoch.current++;working.current=false;requested.current=false;operation.current=null;readScope.current.reset();setChecking(false);setContacts(demo?examples:[]);setQuery('');setLimited(false);setBusy(false);setChannel('whatsapp');clear();
  const foreground=AppState.addEventListener('change',state=>{
   if(state!=='active'||demo||!requested.current)return;
   const generation=epoch.current,valid=readScope.current.beginRefresh();setChecking(true);setContacts([]);
   if(operation.current==='load'){working.current=false;operation.current=null;setBusy(false);}
   const current=()=>alive.current&&epoch.current===generation&&valid();
   void refreshContacts(current).then(result=>{
    if(!current())return;const next=phoneContacts(result.contacts) as Contact[];setContacts(next);setLimited(result.limited);
    setSelected(keys=>keys.filter(id=>next.some(c=>c.id===id&&(channelRef.current==='email'?c.emails.length:c.phones.length))));
    if(!flow.current.reconcile(next)){clear();setMessage('I contatti autorizzati sono cambiati. Scegli di nuovo i nomi per proseguire.');}
    setProgress(flow.current.snapshot());
   }).catch(()=>{if(current()){setContacts([]);clear();setLimited(false);setError('Il consenso alla rubrica è cambiato o non è disponibile. Autorizza i contatti e ricarica i nomi.');}}).finally(()=>{if(current()){readScope.current.finishRefresh(valid);setChecking(false);}});
  });
  return()=>{alive.current=false;epoch.current++;working.current=false;requested.current=false;operation.current=null;readScope.current.reset();flow.current.reset();foreground.remove();};
 },[userId]);
 const load=async()=>{
  if(working.current||readScope.current.isChecking())return;working.current=true;operation.current='load';requested.current=true;const generation=epoch.current,valid=readScope.current.beginRead();clear();setContacts([]);setBusy(true);
  const current=()=>alive.current&&epoch.current===generation&&valid();
  try{const result=await readContacts(current);if(!current())return;const next=phoneContacts(result.contacts) as Contact[];setContacts(next);setLimited(result.limited);if(!next.length)setMessage('Non ci sono contatti con un nome e un recapito utilizzabile tra quelli autorizzati.');}
  catch{if(current())setError('La rubrica non è disponibile. Controlla il consenso nelle impostazioni del telefono e riprova.');}
  finally{if(current()){working.current=false;operation.current=null;setBusy(false);}}
 };
 const compatible=contacts.filter(c=>channel==='email'?c.emails.length:c.phones.length);
 const visible=compatible.filter(c=>c.name.toLocaleLowerCase('it').includes(query.trim().toLocaleLowerCase('it')));
 const allVisible=visible.length>0&&visible.every(c=>selected.includes(c.id));
 let linkReady=false;try{personalInviteMessage(invitationUrl);linkReady=true;}catch{}
 const toggle=(id:string)=>{if(working.current||readScope.current.isChecking())return;setPreview(false);setMessage('');setError('');setSelected(keys=>keys.includes(id)?keys.filter(k=>k!==id):[...keys,id]);};
 const chooseChannel=(value:Channel)=>{if(working.current||readScope.current.isChecking())return;clear();setChannel(value);};
 const openNext=async()=>{
  if(working.current||readScope.current.isChecking())return;working.current=true;operation.current='compose';setBusy(true);setError('');setMessage('');const generation=epoch.current;
  try{
   if(demo){setMessage(`Simulazione completata per ${selected.length} nomi fittizi. Nessuna rubrica letta e nessun messaggio inviato.`);setPreview(false);return;}
   if(!flow.current.snapshot().total)flow.current.start(contactQueue(contacts,selected,channel),personalInviteMessage(invitationUrl));
   const result=await flow.current.next();if(!result||!alive.current||epoch.current!==generation)return;
   setProgress(flow.current.snapshot());
   setMessage(result.status==='cancelled'?`Apertura annullata per ${result.name}. Puoi riprovare o saltare.`:result.status==='saved'?`Bozza salvata per ${result.name}. Non è confermato un invio.`:`Composizione aperta per ${result.name}. Conferma nel canale scelto: l’app non verifica consegna o lettura.`);
  }catch{if(alive.current&&epoch.current===generation){setProgress(flow.current.snapshot());setError('Non è stato possibile aprire il canale scelto. Puoi riprovare oppure saltare questo nome.');}}
  finally{if(alive.current&&epoch.current===generation){working.current=false;operation.current=null;setBusy(false);}}
 };
 return <View style={[s.card,{padding:24,gap:16}]}>
  <Text style={s.eyebrow}>Una balotta più grande</Text><Text style={[s.title,{fontSize:29,lineHeight:35}]}>Invita i tuoi amici</Text><Text style={s.body}>{INVITE_INTRO}</Text>
  <Text style={s.body}>{demo?'Prova la selezione con questi nomi fittizi. Non viene letta la tua rubrica e non parte alcun invito.':'Scegli i nomi dalla rubrica del telefono. Numeri ed email non vengono mostrati nell’elenco né caricati sul nostro server.'}</Text>
  <View style={{flexDirection:'row',gap:7,flexWrap:'wrap'}}>{(['whatsapp','sms','email'] as Channel[]).map(value=><Chip key={value} label={label(value)} active={value===channel} onPress={()=>{if(!progress.total)chooseChannel(value);}}/>)}</View>
  {channel==='sms'?<Text style={[s.body,{fontSize:12,lineHeight:17}]}>Gli SMS seguono il tuo piano telefonico.</Text>:null}
  {!demo&&nativeContactsSupported?<Button label={busy?'Caricamento…':contacts.length?'Ricarica i nomi dalla rubrica':'Scegli dalla rubrica'} secondary disabled={busy||checking||progress.total>0} onPress={()=>void load()}/>:null}
  {!demo&&!nativeContactsSupported?<Text style={s.body}>La rubrica del telefono è disponibile nell’app iOS o Android. Qui non viene richiesta né caricata.</Text>:null}
  {checking?<Text style={s.body}>Verifica dei contatti autorizzati…</Text>:null}
  {limited?<Text style={s.body}>Sono visibili solo i contatti che hai autorizzato sul telefono.</Text>:null}
  {!checking&&!progress.total&&contacts.length?<>
   <TextInput accessibilityLabel="Cerca un nome" placeholder="Cerca un nome" value={query} onChangeText={setQuery} editable={!busy&&!checking} style={s.input}/>
   <Button label={allVisible?'Deseleziona tutti':'Seleziona tutti'} secondary disabled={busy||checking||!visible.length} onPress={()=>{setPreview(false);setMessage('');setSelected(keys=>allVisible?keys.filter(k=>!visible.some(c=>c.id===k)):[...new Set([...keys,...visible.map(c=>c.id)])]);}}/>
   <View style={{gap:10}}>{visible.map(c=><Pressable key={c.id} accessibilityRole="checkbox" accessibilityLabel={`Invita ${c.name}`} accessibilityState={{checked:selected.includes(c.id),disabled:busy}} aria-checked={selected.includes(c.id)} disabled={busy||checking} onPress={()=>toggle(c.id)} style={{padding:12,borderWidth:1.5,borderColor:C.ink,borderRadius:10,backgroundColor:selected.includes(c.id)?C.lime:C.white}}><Text style={s.label}>{selected.includes(c.id)?'✓  ':''}{c.name}</Text></Pressable>)}</View>
   {!visible.length?<Text style={s.body}>Nessun nome disponibile per questo canale o questa ricerca.</Text>:null}
   <Text style={s.label}>{selected.length} contatti selezionati</Text>
  </>:null}
  <Text style={[s.body,{fontSize:12,lineHeight:17}]}>{PERSONAL_INVITE_NOTE}</Text>
  {!demo&&!linkReady?<Text style={s.body}>Il link ufficiale di invito non è ancora disponibile. Puoi scegliere i nomi e vedere l’anteprima.</Text>:null}
  {!checking&&(preview||progress.total)?<View style={{gap:12,padding:16,backgroundColor:C.paper,borderRadius:12}}>
   <Text style={s.label}>Anteprima dell’invito</Text><Text style={s.body}>{INVITE_MESSAGE}</Text><Text style={s.body}>{linkReady?invitationUrl:'Link ufficiale per scoprire l’app'}</Text><Text style={[s.body,{fontSize:12,lineHeight:17}]}>{PERSONAL_INVITE_NOTE}</Text>
   <Text style={s.body}>Si apre un invito alla volta. Conferma l’invio nel canale scelto e torna qui per il nome successivo.</Text>
   {progress.total?<Text accessibilityLiveRegion="polite" style={s.label}>{progress.complete?'Hai aperto o saltato tutti i nomi della selezione.':`${progress.index} di ${progress.total} nomi gestiti · Prossimo: ${progress.currentName}`}</Text>:null}
   {!progress.complete?<Button label={busy?'Apertura…':demo?`Simula invito a tutti i selezionati (${selected.length})`:progress.total?`Apri ${label(channel)} per ${progress.currentName}`:`Invita tutti i selezionati (${selected.length})`} disabled={busy||checking||(!demo&&!linkReady)} onPress={()=>void openNext()}/>:null}
   {progress.total&&!progress.complete?<Button label="Salta questo nome" secondary disabled={busy||checking} onPress={()=>{flow.current.skip();setProgress(flow.current.snapshot());setMessage('Nome saltato, nessun canale aperto.');}}/>:null}
   <Button label="Modifica la selezione" secondary disabled={busy||checking} onPress={()=>{flow.current.reset();setProgress(flow.current.snapshot());setPreview(false);setMessage('');}}/>
  </View>:<Button label="Anteprima dell’invito" secondary disabled={busy||checking||!selected.length} onPress={()=>setPreview(true)}/>}
  {message?<Text accessibilityLiveRegion="polite" style={s.body}>{message}</Text>:null}{error?<Text accessibilityRole="alert" style={[s.body,{color:C.red}]}>{error}</Text>:null}
  <Button label="Continua senza invitare" secondary disabled={busy||checking} onPress={()=>{clear();setContacts(demo?examples:[]);requested.current=false;readScope.current.reset();setQuery('');setMessage('Puoi continuare a usare l’app senza invitare nessuno.');}}/>
 </View>;
}
