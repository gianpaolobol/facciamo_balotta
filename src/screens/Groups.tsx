import React,{useState} from 'react';
import {View,Text} from 'react-native';
import {ACTIVITIES} from '../fixtures';
import {approveRequest} from '../domain.mjs';
import {Avatar,Button,Chip,C,s} from '../ui';
export function Groups() {
 const [activity,setActivity]=useState({...ACTIVITIES[0]});const [rejected,setRejected]=useState(false);const [error,setError]=useState('');
 return <View style={{gap:22,maxWidth:800,width:'100%',alignSelf:'center'}}><View><Text style={s.eyebrow}>LE MIE BALOTTE</Text><Text style={[s.title,{marginTop:7}]}>La compagnia prende forma.</Text><Text style={s.body}>Qui trovi le tue proposte e le richieste da valutare.</Text></View>
  <View style={{backgroundColor:C.violet,padding:15,borderWidth:1.5,borderRadius:12}}><Text style={s.body}>Esempio: stai provando il ruolo di Lea, che organizza una passeggiata. Nessun utente reale è coinvolto.</Text></View>
  <View style={[s.card,{padding:24,gap:15}]}><Text style={s.title}>{activity.title}</Text><Text style={s.body}>{activity.city} · {activity.day} · {activity.time}</Text><Text style={{fontFamily:'ComicNeue_700Bold',fontSize:14}}>{activity.members.length} partecipanti su {activity.capacity}</Text><View style={{flexDirection:'row',gap:7}}>{activity.members.map(id=><Avatar key={id} name={id} size={42} color={C.lime}/>)}</View></View>
  <Text style={[s.title,{fontSize:25}]}>Richieste di partecipazione</Text>
  {activity.requests.includes('nico')&&!rejected?<View style={[s.card,{padding:24,gap:16}]}><View style={{flexDirection:'row',gap:12,alignItems:'center'}}><Avatar name="Nico" size={50}/><View><Text style={{fontFamily:'ComicNeue_700Bold',fontSize:18}}>Nico · profilo fittizio</Text><Text style={s.body}>Bologna</Text></View></View><Text style={s.body}>«Mi piace camminare senza fretta e conoscere persone nuove. Posso unirmi?»</Text><View style={{flexDirection:'row',gap:7}}><Chip label="Passeggiate"/><Chip label="Natura"/></View><Text style={[s.body,{fontSize:13}]}>Interessi pertinenti: passeggiate e natura. La scelta spetta a te.</Text><Button label="Approva la richiesta" onPress={()=>{try{setActivity(approveRequest(activity,'lea','nico'));}catch(e){setError((e as Error).message);}}}/><Button label="Rifiuta la richiesta" secondary onPress={()=>setRejected(true)}/></View>:<View style={[s.card,{padding:24,gap:12}]}><Text style={s.body}>{rejected?'Richiesta rifiutata nell’esempio.':'Nico è stato aggiunto alla balotta di esempio. Ora potrebbe accedere alla chat del gruppo.'}</Text><Button label="Riprova la simulazione" secondary onPress={()=>{setActivity({...ACTIVITIES[0]});setRejected(false);}}/></View>}
  {error?<Text accessibilityLiveRegion="polite" style={s.body}>{error}</Text>:null}
 </View>;
}
