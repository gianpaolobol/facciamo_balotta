import React,{useEffect,useRef,useState} from 'react';
import {Pressable,Text,TextInput,View} from 'react-native';
import {api} from './auth';
import {Button,C,s} from './ui';
import {PreferencesPanel} from './PreferencesPanel';
import {PeerIllustrations} from './PeerIllustrations';
import {ChatPanel,SafetyActions} from './SocialTools';
import {appointmentFields,appointmentProposal,versionedAppointment} from './live-meeting-form.mjs';

type Pairing={id:string;peer:{id:string;name:string};decision:'pending'|'yes';mutual:boolean;appointmentId:string|null;reasons?:string[];sharedAvailability?:string[]};
type Appointment={id:string;members:string[];activity:string;startsAt:string;place:string;cost:string;publicPlace:boolean;version:number;confirmations:string[];status:'proposed'|'confirmed'|'cancelled'};
type Form={activity:string;date:string;time:string;place:string;cost:string;publicPlace:boolean};
const emptyForm=():Form=>({activity:'',date:'',time:'',place:'',cost:'',publicPlace:false});
const slotLabels:Record<string,string>={weekday_day:'in settimana di giorno',weekday_evening:'in settimana di sera',weekend_day:'nel fine settimana di giorno',weekend_evening:'nel fine settimana di sera'};

export function LivePair({userId}:{userId:string}){
 const [pair,setPair]=useState<Pairing|null>(null),[appointment,setAppointment]=useState<Appointment|null>(null),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[stale,setStale]=useState(false),[editing,setEditing]=useState(false),[form,setForm]=useState<Form>(emptyForm),[cancelQuestion,setCancelQuestion]=useState(false);
 const lock=useRef(false),generation=useRef(0);
 const readSnapshot=async()=>{
  const requestedGeneration=generation.current;
  const data=await api('/api/pairings');
  const next:Pairing|null=data.pairings[0]||null;
  const meeting:Appointment|null=next?.appointmentId?(await api('/api/appointments/'+encodeURIComponent(next.appointmentId))).appointment:null;
  if(requestedGeneration!==generation.current)return;
  setPair(next);setAppointment(meeting);setEditing(false);setCancelQuestion(false);setForm(meeting?appointmentFields(meeting):emptyForm());setStale(false);setLoaded(true);
 };
 const reload=async()=>{
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{await readSnapshot();}catch(e){setStale(true);setError(e instanceof Error?e.message:'Non è stato possibile caricare le proposte.');}
  finally{lock.current=false;setBusy(false);}
 };
 useEffect(()=>{void reload();},[userId]);
 const mutate=async(path:string,method:string,body:unknown)=>{
  if(lock.current||stale)return;lock.current=true;setBusy(true);setError('');
  let saved=false;
  try{await api(path,method,body);saved=true;await readSnapshot();}
  catch(e){
   const conflict=(e as {status?:number}).status===409;
   if(conflict||saved)setStale(true);
   setError(conflict?'La proposta è cambiata. La tua bozza resta qui: ricarica e controlla i nuovi dettagli prima di continuare.':saved?'La scelta è stata salvata, ma non è stato possibile aggiornare la schermata. Ricarica prima di continuare.':e instanceof Error?e.message:'Non è stato possibile completare l’operazione.');
  }finally{lock.current=false;setBusy(false);}
 };
 const submit=()=>{
  if(!pair||lock.current||stale)return;
  try{
   const proposal=appointmentProposal(form);
   if(appointment)void mutate('/api/appointments/'+encodeURIComponent(appointment.id),'PATCH',versionedAppointment(appointment,proposal));
   else void mutate('/api/pairings/'+encodeURIComponent(pair.id)+'/appointment','POST',proposal);
  }catch(e){setError(e instanceof Error?e.message:'Controlla i dettagli dell’incontro.');}
 };
 const blocked=()=>{generation.current++;setPair(null);setAppointment(null);setEditing(false);setForm(emptyForm());setLoaded(true);void reload();};
 const disabled=busy||stale;
 const field=(key:Exclude<keyof Form,'publicPlace'>,label:string,maxLength:number,placeholder?:string)=><View key={key}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} editable={!disabled} value={form[key]} maxLength={maxLength} placeholder={placeholder} placeholderTextColor={C.muted} onChangeText={value=>setForm(current=>({...current,[key]:value}))} style={s.input} autoCapitalize={key==='date'||key==='time'?'none':'sentences'} /></View>;
 return <View style={{gap:20,maxWidth:740,width:'100%',alignSelf:'center'}}>
  <View><Text style={s.eyebrow}>A DUE</Text><Text style={s.title}>Una persona da conoscere.</Text><Text style={s.body}>Una proposta alla volta, a partire dai vostri interessi e dalle disponibilità dichiarate.</Text></View>
  {busy?<Text accessibilityLiveRegion="polite" style={s.body}>Aggiornamento in corso…</Text>:null}
  {error?<Text accessibilityRole="alert" style={[s.body,{color:C.red}]}>{error}</Text>:null}
  <Button label={stale?'Ricarica e controlla la proposta':'Aggiorna proposte'} secondary disabled={busy} onPress={()=>void reload()}/>
  {loaded&&!pair?<View style={[s.card,{padding:22,gap:12}]}><Text style={s.title}>Aspettiamo una buona occasione.</Text><Text style={s.body}>Non ci sono proposte disponibili. Controlla che il tuo profilo sia completo e scegli nelle preferenze se comparire, dove e quando incontrare persone.</Text><PreferencesPanel/></View>:null}
  {loaded&&pair?<>
   <View style={[s.card,{padding:22,gap:15}]}>
    <Text style={s.title}>{pair.peer.name}</Text>
    <PeerIllustrations pairId={pair.id}/>
    {pair.reasons?.length?<Text style={s.body}>Interessi dichiarati in comune: {pair.reasons.join(', ')}.</Text>:<Text style={s.body}>Questa proposta segue le vostre preferenze dichiarate.</Text>}
    {pair.sharedAvailability?.length?<Text style={s.body}>Disponibilità in comune: {pair.sharedAvailability.map(slot=>slotLabels[slot]||slot).join(', ')}.</Text>:null}
    {pair.mutual?<Text style={[s.body,{color:C.ink}]}>Vi interessate entrambi. Potete scrivervi e concordare un incontro.</Text>:pair.decision==='yes'?<Text style={s.body}>Hai espresso interesse. Aspettiamo la risposta dell’altra persona; la chat si apre soltanto dopo due sì.</Text>:<Text style={s.body}>Ti va di fare il primo passo? L’altra persona sceglierà in autonomia.</Text>}
    {pair.decision==='pending'?<Button label="Sì, mi interessa" disabled={disabled} onPress={()=>void mutate('/api/pairings/'+encodeURIComponent(pair.id)+'/decision','POST',{decision:'yes'})}/>:null}
    <Button label={pair.decision==='yes'?'Ritiro il mio interesse':'Passo, grazie'} secondary disabled={disabled} onPress={()=>void mutate('/api/pairings/'+encodeURIComponent(pair.id)+'/decision','POST',{decision:'no'})}/>
    {pair.decision==='yes'?<Text style={[s.body,{fontSize:13}]}>Ritirando l’interesse chiudi questa proposta e annulli anche l’eventuale appuntamento.</Text>:null}
    <SafetyActions userId={pair.peer.id} onBlocked={blocked}/>
   </View>
   {pair.mutual?<>
    <View style={[s.card,{padding:22,gap:15}]}>
     <Text style={s.eyebrow}>IL VOSTRO INCONTRO</Text>
     {appointment?<>
      <Text style={s.title}>{appointment.activity}</Text>
      <Text style={s.body}>{new Date(appointment.startsAt).toLocaleString('it-IT',{dateStyle:'long',timeStyle:'short'})} · ora locale</Text>
      <Text style={s.body}>{appointment.place}{'\n'}Costo: {appointment.cost}</Text>
      <Text style={[s.body,{color:C.ink}]}>{appointment.status==='cancelled'?'Incontro annullato. Questa proposta non può essere riaperta.':appointment.status==='confirmed'?'Avete confermato entrambi questi dettagli.':appointment.confirmations.includes(userId)?'Hai confermato questi dettagli. Aspettiamo la conferma dell’altra persona.':'Controlla i dettagli e conferma soltanto se ti vanno bene.'}</Text>
      {appointment.status!=='cancelled'&&!editing?<>
       {!appointment.confirmations.includes(userId)?<Button label="Confermo questi dettagli" disabled={disabled} onPress={()=>void mutate('/api/appointments/'+encodeURIComponent(appointment.id)+'/confirm','POST',versionedAppointment(appointment))}/>:null}
       <Button label="Proponi una modifica" secondary disabled={disabled} onPress={()=>{setForm(appointmentFields(appointment));setEditing(true);setCancelQuestion(false);setError('');}}/>
       {cancelQuestion?<><Text style={s.body}>Vuoi annullare questo incontro per entrambi? Non potrai riaprire questa proposta.</Text><Button label="Sì, annulla l’incontro" disabled={disabled} onPress={()=>void mutate('/api/appointments/'+encodeURIComponent(appointment.id)+'/cancel','POST',versionedAppointment(appointment))}/><Button label="Mantieni l’incontro" secondary disabled={busy} onPress={()=>setCancelQuestion(false)}/></>:<Button label="Annulla l’incontro" secondary disabled={disabled} onPress={()=>setCancelQuestion(true)}/>}
      </>:null}
     </>:<Text style={s.body}>Proponi un’attività con giorno, ora, luogo pubblico e costo chiaro. Poi dovrete confermare entrambi gli stessi dettagli.</Text>}
     {(!appointment||editing)?<View style={{gap:13}}>
      {field('activity','Che cosa proponi?',140,'Ad esempio: una passeggiata')}
      {field('date','Giorno (AAAA-MM-GG)',10,'2026-11-15')}
      {field('time','Ora locale (HH:MM)',5,'16:30')}
      <Text style={[s.body,{fontSize:13}]}>Usiamo il fuso orario del tuo dispositivo. Scegli una data futura entro 180 giorni.</Text>
      {field('place','Luogo pubblico e punto di ritrovo',240)}
      {field('cost','Costo previsto (scrivi anche se è gratuito)',140)}
      <Pressable accessibilityRole="checkbox" aria-checked={form.publicPlace} accessibilityState={{checked:form.publicPlace,disabled}} disabled={disabled} onPress={()=>setForm(current=>({...current,publicPlace:!current.publicPlace}))} style={{padding:13,borderWidth:1,borderColor:C.ink,borderRadius:10,backgroundColor:form.publicPlace?C.lime:C.white}}><Text style={s.body}>{form.publicPlace?'✓  ':'○  '}Confermo che il luogo è pubblico</Text></Pressable>
      <Text style={[s.body,{fontSize:13}]}>L’app non verifica il luogo e non effettua prenotazioni o pagamenti. Ogni modifica richiede due nuove conferme.</Text>
      <Button label={appointment?'Invia modifica':'Proponi questo incontro'} disabled={disabled} onPress={submit}/>
      {appointment?<Button label="Torna ai dettagli salvati" secondary disabled={busy} onPress={()=>{setEditing(false);setForm(appointmentFields(appointment));setError('');}}/>:null}
     </View>:null}
    </View>
    <ChatPanel kind="pair" id={pair.id}/>
   </>:null}
  </>:null}
 </View>;
}
