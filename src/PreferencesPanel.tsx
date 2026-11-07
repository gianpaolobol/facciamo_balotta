import React,{useEffect,useRef,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {api} from './auth';
import {Button,C,s} from './ui';

type Availability='weekday_day'|'weekday_evening'|'weekend_day'|'weekend_evening';
type Preferences={enabled:boolean;intent:'friendship'|'dating'|'both';scope:'province'|'region';availability:Availability[];accepted:boolean;policyVersion:string};
const slots:Array<[Availability,string]>=[['weekday_day','In settimana · di giorno'],['weekday_evening','In settimana · di sera'],['weekend_day','Nel fine settimana · di giorno'],['weekend_evening','Nel fine settimana · di sera']];
const fresh:Preferences={enabled:false,intent:'friendship',scope:'province',availability:[],accepted:false,policyVersion:'2026-11-07'};

function Choice({label,checked,onPress,disabled=false}:{label:string;checked:boolean;onPress:()=>void;disabled?:boolean}){
 return <Pressable accessibilityRole="checkbox" aria-checked={checked} accessibilityState={{checked,disabled}} disabled={disabled} onPress={onPress} style={{borderWidth:1,borderColor:C.ink,borderRadius:10,padding:13,backgroundColor:checked?C.lime:C.white,opacity:disabled?.6:1}}><Text style={[s.body,{color:C.ink}]}>{checked?'✓  ':'○  '}{label}</Text></Pressable>;
}

export function PreferencesPanel(){
 const [form,setForm]=useState<Preferences>(fresh),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const lock=useRef(false);
 const load=async()=>{
  if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');
  try{const {preferences}=await api('/api/preferences');setForm(preferences?{...preferences,accepted:preferences.accepted===true&&preferences.policyVersion==='2026-11-07'}:{...fresh,availability:[]});setLoaded(true);}
  catch(e){setError(e instanceof Error?e.message:'Non è stato possibile caricare le preferenze.');}
  finally{lock.current=false;setBusy(false);}
 };
 useEffect(()=>{void load();},[]);
 const update=(change:Partial<Preferences>)=>{setForm(current=>({...current,...change}));setMessage('');};
 const save=async()=>{
  if(lock.current||!loaded)return;
  if(form.enabled&&!form.accepted){setError('Leggi e accetta le regole della beta prima di comparire nelle proposte.');return;}
  if(form.enabled&&!form.availability.length){setError('Scegli almeno una disponibilità per ricevere proposte.');return;}
  lock.current=true;setBusy(true);setError('');setMessage('');
  try{const {preferences}=await api('/api/preferences','PUT',{...form,policyVersion:'2026-11-07'});if(preferences)setForm(preferences);setMessage(form.enabled?'Preferenze salvate. Puoi ricevere una proposta compatibile.':'Preferenze salvate. Non riceverai nuove proposte. Le connessioni già reciproche restano disponibili.');}
  catch(e){setError(e instanceof Error?e.message:'Non è stato possibile salvare le preferenze.');}
  finally{lock.current=false;setBusy(false);}
 };
 return <View style={[s.card,{padding:20,gap:14}]}>
  <Text style={s.eyebrow}>LE TUE PREFERENZE A DUE</Text>
  <Text style={s.body}>Decidi se ricevere proposte. Le preferenze restano private; alle persone compatibili mostri il nome, gli interessi condivisi e soltanto le illustrazioni che hai approvato. Descrizioni private e anteprime restano riservate.</Text>
  {!loaded&&busy?<Text style={s.body}>Caricamento delle preferenze…</Text>:null}
  {loaded?<>
   <Choice label="Voglio comparire nelle proposte e condividere il mio profilo con persone compatibili" checked={form.enabled} disabled={busy} onPress={()=>update({enabled:!form.enabled})}/>
   <Text style={s.label}>Che cosa cerchi?</Text>
   {([['friendship','Amicizia'],['dating','Appuntamenti'],['both','Amicizia e appuntamenti']] as const).map(([intent,label])=><Choice key={intent} label={label} checked={form.intent===intent} disabled={busy} onPress={()=>update({intent})}/>)}
   <Text style={s.label}>Dove vuoi conoscere persone?</Text>
   <Choice label="Nella stessa provincia del mio profilo" checked={form.scope==='province'} disabled={busy} onPress={()=>update({scope:'province'})}/>
   <Choice label="In tutta l’Emilia-Romagna, se anche l’altra persona lo desidera" checked={form.scope==='region'} disabled={busy} onPress={()=>update({scope:'region'})}/>
   <Text style={s.label}>Quando sei disponibile?</Text>
   {slots.map(([value,label])=><Choice key={value} label={label} checked={form.availability.includes(value)} disabled={busy} onPress={()=>update({availability:form.availability.includes(value)?form.availability.filter(item=>item!==value):[...form.availability,value]})}/>)}
   <Text style={s.body}>Regole della beta: soltanto maggiorenni, rispetto reciproco e incontri in luoghi pubblici. Puoi ritirare il tuo interesse, bloccare o segnalare una persona. Nessuna prenotazione o pagamento viene effettuato dall’app. Questa è una versione di prova; le informative definitive sono ancora da completare prima dell’apertura pubblica.</Text>
   <Choice label="Ho letto e accetto queste regole della beta" checked={form.accepted} disabled={busy} onPress={()=>update({accepted:!form.accepted})}/>
   <Button label={busy?'Attendi…':'Salva preferenze'} disabled={busy} onPress={()=>void save()}/>
  </>:null}
  {error?<Text accessibilityRole="alert" style={[s.body,{color:C.red}]}>{error}</Text>:null}
  {message?<Text accessibilityLiveRegion="polite" style={[s.body,{color:C.ink}]}>{message}</Text>:null}
  <Button label="Ricarica preferenze salvate" secondary disabled={busy} onPress={()=>void load()}/>
 </View>;
}
