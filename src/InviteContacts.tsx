import React,{useEffect,useRef,useState} from 'react';
import {Pressable,Text,TextInput,View} from 'react-native';
import * as Crypto from 'expo-crypto';
import {api} from './auth';import {Button,C,s} from './ui';
import {addInviteContact,createInviteFlow,selectedRecipients,INVITE_INTRO,INVITE_PRIVACY_NOTE,INVITE_MESSAGE,INVITE_LIMIT} from './invitations.mjs';
type Contact={key:string;name:string;channel:'email'|'phone';address:string};
const examples:Contact[]=[{key:'email:ada@example.test',name:'Ada · esempio',channel:'email',address:'ada@example.test'},{key:'email:luca@example.test',name:'Luca · esempio',channel:'email',address:'luca@example.test'},{key:'email:bea@example.test',name:'Bea · esempio',channel:'email',address:'bea@example.test'}];
export function InviteContacts({userId}:{userId?:string}){
 const demo=!userId;
 const [contacts,setContacts]=useState<Contact[]>(demo?examples:[]),[selected,setSelected]=useState<string[]>([]),[name,setName]=useState(''),[address,setAddress]=useState('');
 const [capability,setCapability]=useState<{enabled:boolean;channels:string[]}|null>(demo?{enabled:false,channels:[]}:null),[preview,setPreview]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const sending=useRef(false),active=useRef(false),scope=useRef(0),flow=useRef(createInviteFlow({request:api,newBatchId:()=>Crypto.randomUUID()}));
 useEffect(()=>{
  active.current=true;sending.current=false;scope.current++;setContacts(demo?examples:[]);setSelected([]);setName('');setAddress('');setPreview(false);setMessage('');setError('');setBusy(false);flow.current.reset();
  if(!demo){setCapability(null);const generation=scope.current;void api('/api/config').then(c=>{if(active.current&&scope.current===generation)setCapability({enabled:c.features?.invitations===true,channels:Array.isArray(c.invitationChannels)?c.invitationChannels:[]});}).catch(()=>{if(active.current&&scope.current===generation)setCapability({enabled:false,channels:[]});});}
  return()=>{active.current=false;scope.current++;flow.current.reset();};
 },[userId]);
 const change=()=>{setPreview(false);setMessage('');setError('');};
 const add=()=>{try{const next=addInviteContact(contacts,{name,address}) as Contact[];setContacts(next);setSelected(keys=>[...keys,next[next.length-1].key]);setName('');setAddress('');change();}catch(e){setError((e as Error).message);}};
 const toggle=(key:string)=>{if(busy)return;change();setSelected(keys=>keys.includes(key)?keys.filter(k=>k!==key):[...keys,key]);};
 const canSend=demo||Boolean(capability?.enabled&&contacts.filter(c=>selected.includes(c.key)).every(c=>capability.channels.includes(c.channel)));
 const send=async()=>{
  if(!preview||sending.current||!selected.length||!canSend)return;
  sending.current=true;
  const generation=scope.current;setBusy(true);setError('');setMessage('');
  try{
   const recipients=selectedRecipients(contacts,selected);
   if(demo){setMessage(`Simulazione completata per ${recipients.length} contatti fittizi. Nessun invito reale è stato inviato.`);setPreview(false);return;}
   const result=await flow.current.submit(recipients);if(!result||!active.current||scope.current!==generation)return;
   const rows=Array.isArray(result.results)?result.results:[];
   if(rows.length!==recipients.length)throw Error('Non è stato possibile verificare tutti gli esiti. Riprova senza cambiare la selezione.');
   const accepted=rows.filter((r:{status:string})=>r.status==='accepted').length,failed=rows.filter((r:{status:string})=>r.status==='failed').length,unknown=rows.length-accepted-failed;
   setMessage(`${accepted} inviti accettati dal servizio; ${failed} non inviati; ${unknown} con esito da verificare. L’accettazione non conferma la consegna o la lettura.`);
  }catch(e){if(active.current&&scope.current===generation)setError((e as Error).message);}
  finally{if(active.current&&scope.current===generation){sending.current=false;setBusy(false);}}
 };
 return <View style={[s.card,{padding:24,gap:16}]}>
  <Text style={s.eyebrow}>Una balotta più grande</Text><Text style={[s.title,{fontSize:29,lineHeight:35}]}>Invita i tuoi contatti</Text><Text style={s.body}>{INVITE_INTRO}</Text>
  <Text style={s.body}>{demo?'Prova con questi contatti fittizi: la simulazione non legge la rubrica e non invia messaggi.':'Aggiungi le persone che vuoi invitare. Solo i contatti selezionati verranno usati per l’invio; la rubrica non viene letta automaticamente.'}</Text>
  {!demo?<View style={{gap:10}}><TextInput accessibilityLabel="Nome del contatto facoltativo" placeholder="Nome facoltativo, visibile solo qui" value={name} onChangeText={setName} maxLength={60} editable={!busy} style={s.input}/><TextInput accessibilityLabel="Email o telefono del contatto" placeholder="Email oppure telefono con +39" autoCapitalize="none" autoCorrect={false} value={address} onChangeText={setAddress} maxLength={254} editable={!busy} style={s.input}/><Button label="Aggiungi contatto" secondary disabled={busy||!address.trim()||contacts.length>=INVITE_LIMIT} onPress={add}/></View>:null}
  {contacts.length?<>
   <Button label={selected.length===contacts.length?'Deseleziona tutti':'Seleziona tutti'} secondary disabled={busy} onPress={()=>{change();setSelected(selected.length===contacts.length?[]:contacts.map(c=>c.key));}}/>
   {contacts.map(c=><View key={c.key} style={{flexDirection:'row',alignItems:'center',gap:12}}><Pressable accessibilityRole="checkbox" accessibilityLabel={`Invita ${c.name||c.address}`} accessibilityState={{checked:selected.includes(c.key),disabled:busy}} aria-checked={selected.includes(c.key)} disabled={busy} onPress={()=>toggle(c.key)} style={{flex:1,padding:12,borderWidth:1.5,borderColor:C.ink,borderRadius:10,backgroundColor:selected.includes(c.key)?C.lime:C.white}}><Text style={s.label}>{selected.includes(c.key)?'✓  ':''}{c.name||c.address}</Text>{c.name?<Text style={s.body}>{c.address}</Text>:null}</Pressable>{!demo?<Button label="Rimuovi" secondary disabled={busy} onPress={()=>{change();setContacts(items=>items.filter(i=>i.key!==c.key));setSelected(items=>items.filter(k=>k!==c.key));}}/>:null}</View>)}
   <Text style={s.label}>{selected.length} contatti selezionati</Text>
  </>:null}
  <Text style={[s.body,{fontSize:12,lineHeight:17}]}>{INVITE_PRIVACY_NOTE}</Text>
  {!demo&&capability&&!capability.enabled?<Text style={s.body}>L’invio anonimo non è ancora disponibile. Puoi preparare la selezione: nessun invito partirà finché il servizio non sarà attivo.</Text>:null}
  {!demo&&capability?.enabled&&!canSend?<Text style={s.body}>Uno o più contatti scelti usano un canale non ancora disponibile. Modifica la selezione prima dell’invio.</Text>:null}
  {preview?<View style={{gap:12,padding:16,backgroundColor:C.paper,borderRadius:12}}><Text style={s.label}>Anteprima dell’invito</Text><Text style={s.body}>{INVITE_MESSAGE}</Text><Text style={s.body}>Link ufficiale per scoprire l’app</Text><Text style={[s.body,{fontSize:12,lineHeight:17}]}>{INVITE_PRIVACY_NOTE}</Text><Button label={busy?'Invio in corso…':demo?`Simula invito a tutti i selezionati (${selected.length})`:`Invita tutti i selezionati (${selected.length})`} disabled={busy||!canSend} onPress={()=>void send()}/><Button label="Modifica la selezione" secondary disabled={busy} onPress={()=>setPreview(false)}/></View>:<Button label="Anteprima dell’invito" secondary disabled={busy||!selected.length} onPress={()=>{setError('');setPreview(true);}}/>}
  {message?<Text accessibilityLiveRegion="polite" style={s.body}>{message}</Text>:null}{error?<Text accessibilityRole="alert" style={[s.body,{color:C.red}]}>{error}</Text>:null}
  <Button label="Continua senza invitare" secondary disabled={busy} onPress={()=>{change();setSelected([]);setContacts(demo?examples:[]);setName('');setAddress('');setMessage('Puoi continuare a usare l’app senza invitare nessuno.');}}/>
 </View>;
}
