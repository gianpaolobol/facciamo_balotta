import React,{useCallback,useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Text,View} from 'react-native';
import {api} from './auth';
import {Button,C,s} from './ui';
type Notification={id:number;kind:'pair'|'message'|'request'|'approval';pairId?:string;groupId?:string;created:number;read:boolean};
const labels:Record<Notification['kind'],string>={pair:'È disponibile una proposta a due.',message:'Hai un nuovo messaggio in una conversazione.',request:'C’è una richiesta per una tua attività.',approval:'La tua partecipazione a un’attività è stata approvata.'};
const explain=(error:unknown)=>error instanceof Error?error.message:'Gli aggiornamenti non sono disponibili. Riprova.';
export function NotificationInbox(){
 const [notifications,setNotifications]=useState<Notification[]>([]),[unread,setUnread]=useState(0),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const alive=useRef(false),epoch=useRef(0),operation=useRef(false);
 const load=useCallback(async()=>{
  if(!alive.current)return;
  const version=++epoch.current;setLoading(true);setNotifications([]);setUnread(0);setError('');
  try{const result=await api('/api/notifications');if(alive.current&&epoch.current===version){setNotifications(result.notifications);setUnread(result.unread);}}
  catch(e){if(alive.current&&epoch.current===version)setError(explain(e));}
  finally{if(alive.current&&epoch.current===version)setLoading(false);}
 },[]);
 useEffect(()=>{alive.current=true;void load();return()=>{alive.current=false;epoch.current++;};},[load]);
 const markRead=async(id?:number)=>{
  if(operation.current||!alive.current)return;
  operation.current=true;setBusy(true);setError('');
  try{await api(id===undefined?'/api/notifications/read-all':`/api/notifications/${id}/read`,'POST',{});if(alive.current)await load();}
  catch(e){if(alive.current){setNotifications([]);setUnread(0);setError(explain(e));}}
  finally{operation.current=false;if(alive.current)setBusy(false);}
 };
 return <View style={{gap:14}}>
  <Text style={s.eyebrow}>Aggiornamenti nell’app</Text>
  <Text style={s.body}>Proposte, richieste e messaggi delle tue conversazioni. Apri A due o Le mie balotte per i dettagli.</Text>
  <Text accessibilityLiveRegion="polite" style={s.label}>{unread===1?'1 aggiornamento da leggere':`${unread} aggiornamenti da leggere`}</Text>
  <Button label="Aggiorna la casella" secondary disabled={loading||busy} onPress={()=>void load()}/>
  <Button label="Segna tutti come letti" secondary disabled={loading||busy||unread===0} onPress={()=>void markRead()}/>
  {error?<Text accessibilityRole="alert" style={{color:C.red}}>{error}</Text>:null}
  {loading?<ActivityIndicator color={C.red} accessibilityLabel="Caricamento aggiornamenti"/>:!error&&!notifications.length?<Text style={s.body}>Non ci sono aggiornamenti disponibili.</Text>:null}
  {notifications.map(notification=><View key={notification.id} style={[s.card,{padding:16,gap:10,backgroundColor:notification.read?C.white:C.paper}]}>
   <Text style={s.label}>{notification.read?'Letto':'Da leggere'}</Text>
   <Text style={s.body}>{labels[notification.kind]||'C’è un aggiornamento nelle tue attività.'}</Text>
   <Text style={s.body}>{new Date(notification.created).toLocaleString('it-IT',{dateStyle:'medium',timeStyle:'short'})}</Text>
   {!notification.read?<Button label="Segna come letto" secondary disabled={busy||loading} onPress={()=>void markRead(notification.id)}/>:null}
  </View>)}
 </View>;
}
