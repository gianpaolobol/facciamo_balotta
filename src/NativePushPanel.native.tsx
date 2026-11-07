import React,{useEffect,useRef,useState} from 'react';
import {ActivityIndicator,AppState,Text,View} from 'react-native';
import {api} from './auth';
import {getNativePushFlow} from './push-device.native';
import {Button,C,s} from './ui';
const flow=getNativePushFlow(api);
export function NativePushPanel({userId}:{userId:string}){
 const [status,setStatus]=useState(flow.snapshot()),[error,setError]=useState('');
 const alive=useRef(false);
 useEffect(()=>{
  alive.current=true;setError('');
  let cancelled=false;
  const unsubscribe=flow.subscribe(setStatus);
  const refresh=()=>{void flow.setAccount(userId).catch(()=>{if(!cancelled)setError('Non è stato possibile verificare o disattivare gli avvisi. Riprova con una connessione disponibile.');});};
  refresh();
  const foreground=AppState.addEventListener('change',next=>{if(next==='active')refresh();});
  return()=>{cancelled=true;alive.current=false;unsubscribe();foreground.remove();void flow.detach(userId).catch(()=>{});};
 },[userId]);
 const run=async(operation:()=>Promise<void>)=>{
  setError('');
  try{await operation();}
  catch(e){if(alive.current&&flow.snapshot().accountId===userId)setError(e instanceof Error?e.message:'Operazione non disponibile. Riprova.');}
 };
 const own=status.accountId===userId;
 return <View style={{gap:12}}>
  <Text style={s.eyebrow}>Avvisi sul telefono</Text>
  <Text style={s.body}>Facoltativi: sullo schermo bloccato compare solo «Hai nuovi aggiornamenti nell’app.». Nessun nome o messaggio privato. Apri l’app e accedi per i dettagli.</Text>
  <Text accessibilityLiveRegion="polite" style={s.label}>{own&&status.enabled?'Avvisi attivati su questo telefono.':status.pendingDisable?'Disattivazione da confermare: connettiti e riprova.':'Avvisi non attivati su questo telefono.'}</Text>
  <Text style={s.body}>Puoi cambiare questa scelta in qualsiasi momento. L’attivazione non invia gli aggiornamenti passati.</Text>
  {own&&status.enabled||status.pendingDisable?<Button label={status.pendingDisable?'Riprova la disattivazione':'Disattiva gli avvisi'} secondary disabled={status.busy} onPress={()=>void run(()=>flow.disable())}/>:<Button label="Attiva gli avvisi" secondary disabled={!own||status.busy} onPress={()=>void run(()=>flow.enable())}/>}
  {status.busy?<ActivityIndicator color={C.red} accessibilityLabel="Verifica degli avvisi"/>:null}
  {error?<><Text accessibilityRole="alert" style={{color:C.red}}>{error}</Text><Button label="Verifica di nuovo" secondary disabled={status.busy} onPress={()=>void run(()=>flow.setAccount(userId))}/></>:null}
 </View>;
}
