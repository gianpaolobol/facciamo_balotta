import React,{useState,useEffect} from 'react';
import {View,Text,TextInput,Switch} from 'react-native';
import {Avatar,Button,Chip,C,s} from '../ui';
import {CITIES} from '../fixtures';
import {api,deleteAccount,signOut,type User} from '../auth';
import {INTEREST_LABELS} from '../art-catalog.mjs';
import {toggleInterest} from '../interest-tools.mjs';
import {IllustratedProfileForm} from '../IllustratedProfileForm';
import {LiveProfileTools} from '../LiveArea';
export function Profile({user,onExit}:{user:User|null;onExit:()=>void}) {
 const [name,setName]=useState(user?.name||'');const [city,setCity]=useState('Bologna');const [adult,setAdult]=useState(false);const [interests,setInterests]=useState<string[]>([]);const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [confirmDelete,setConfirmDelete]=useState(false);
 useEffect(()=>{let active=true;if(user) api('/api/profile').then(({profile})=>{if(active&&profile){setName(profile.name);setCity(profile.city);setAdult(profile.adult);setInterests(profile.interests);}}).catch(e=>{if(active)setMessage(e.message);});return()=>{active=false;};},[user]);
 const choices=INTEREST_LABELS;
 const save=async()=>{setBusy(true);try{await api('/api/profile','PUT',{name,city,adult,interests});setMessage('Profilo salvato.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}};
 return <View style={{gap:23,maxWidth:720,width:'100%',alignSelf:'center'}}><View><Text style={s.eyebrow}>LE COSE CHE TI MUOVONO</Text><Text style={[s.title,{marginTop:7}]}>La balotta parte da te.</Text><Text style={s.body}>{user?'Completa il tuo profilo. I dati privati restano separati dalle attività.':'Profilo illustrativo: qui non inserisci né salvi dati personali.'}</Text></View>
  <View style={[s.card,{padding:25,gap:22}]}><View style={{flexDirection:'row',gap:16,alignItems:'center'}}><Avatar name={user?name||'B':'A'} size={76} color={C.lime}/><View><Text style={[s.title,{fontSize:28}]}>{user?'Il tuo profilo':'Ada · esempio'}</Text><Text style={s.body}>{user?'Beta riservata':'Persona fittizia, passioni vere'}</Text></View></View>
   {user?<View><Text style={s.label}>Come vuoi essere chiamato?</Text><TextInput accessibilityLabel="Nome visualizzato" style={s.input} value={name} onChangeText={setName} maxLength={50}/></View>:null}
   <View><Text style={s.label}>Provincia</Text><View style={{flexDirection:'row',gap:7,flexWrap:'wrap'}}>{CITIES.slice(1).map(c=><Chip key={c} label={c} active={city===c} onPress={()=>setCity(c)}/>)}</View></View>
   <View><Text style={s.label}>Che cosa ti piace fare? ({interests.length}/15)</Text><View style={{flexDirection:'row',gap:7,flexWrap:'wrap'}}>{choices.map(c=><Chip key={c} label={c} active={interests.includes(c)} onPress={()=>{try{setInterests(toggleInterest(interests,c));setMessage('');}catch(e){setMessage((e as Error).message);}}}/>)}</View></View>
   {user?<><View style={{flexDirection:'row',gap:12,alignItems:'center'}}><Switch accessibilityLabel="Confermo di avere almeno 18 anni" value={adult} onValueChange={setAdult}/><Text style={[s.body,{flex:1}]}>Confermo di avere almeno 18 anni.</Text></View><Button label={busy?'Salvataggio…':'Salva il profilo'} disabled={busy||!adult||!name.trim()} onPress={save}/></>:<View style={{backgroundColor:C.paper,padding:15,borderWidth:1.5,borderRadius:10}}><Text style={s.body}>Puoi toccare gli interessi per provare la selezione. Le scelte si azzerano uscendo dalla schermata e non vengono inviate a un server.</Text></View>}
   {message?<Text accessibilityLiveRegion="polite" style={s.body}>{message}</Text>:null}
  </View>
  <IllustratedProfileForm demo={!user}/>{user?<LiveProfileTools key={user.id} userId={user.id}/>:null}
  {user?<View style={{gap:15}}><Button label="Esci dall’account" secondary onPress={async()=>{try{await signOut();onExit();}catch(e){setMessage((e as Error).message);}}}/><Button label={confirmDelete?'Conferma cancellazione definitiva':'Cancella il mio account'} secondary onPress={async()=>{if(!confirmDelete){setConfirmDelete(true);setMessage('Premi di nuovo per cancellare account e profilo.');return;}try{await deleteAccount();onExit();}catch(e){setMessage((e as Error).message);}}}/></View>:null}
 </View>;
}
