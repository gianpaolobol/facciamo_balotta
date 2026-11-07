import React,{useEffect,useState} from 'react';import {View,Text} from 'react-native';
import {api,getFeatures,type Features} from './auth';import {Button,s} from './ui';
import {LivePair} from './LivePair';import {LiveGroups} from './LiveGroups';import {PreferencesPanel} from './PreferencesPanel';import {SecurityPanel,ModerationPanel} from './SocialTools';
import {AppointmentHistory} from './AppointmentHistory';
import {NativePushPanel} from './NativePushPanel';
import {NotificationInbox} from './NotificationInbox';
function useLiveFeatures(userId:string){
 const [features,setFeatures]=useState<Features|null>(null),[moderation,setModeration]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setFeatures(null);setError('');setModeration(false);(async()=>{try{const f=await getFeatures();let mod=false;if(f.community)mod=(await api('/api/community-capabilities')).moderation===true;if(active){setFeatures(f);setModeration(mod);}}catch(e){if(active)setError(e instanceof Error?e.message:'Servizio non disponibile.');}})();return()=>{active=false;};},[userId,attempt]);
 return {features,moderation,error,reload:()=>setAttempt(v=>v+1)};
}
export function LiveArea({userId,tab}:{userId:string;tab:string}){
 const {features,error,reload}=useLiveFeatures(userId);
 if(error)return <View style={[s.card,{padding:24,gap:14}]}><Text accessibilityLiveRegion="polite" style={s.body}>{error}</Text><Button label="Riprova" onPress={reload}/></View>;
 if(!features)return <Text style={s.body}>Caricamento della tua balotta…</Text>;
 if(tab==='A due'&&features.meetings&&features.matching)return <LivePair key={userId} userId={userId}/>;
 if(tab==='Le mie balotte'&&(features.meetings||features.groups))return <View key={userId} style={{gap:30}}>{features.meetings?<AppointmentHistory/>:null}{features.groups?<LiveGroups mine/>:null}</View>;
 if(tab==='Scopri'&&features.groups)return <LiveGroups key={userId+tab}/>;
 return <View style={[s.card,{padding:24,gap:14}]}><Text style={s.title}>La tua balotta si sta preparando.</Text><Text style={s.body}>Questa sezione sarà disponibile dopo l’attivazione e il collaudo del servizio. Puoi già completare il profilo nelle sezioni abilitate.</Text><Button label="Aggiorna disponibilità" secondary onPress={reload}/></View>;
}
export function LiveProfileTools({userId}:{userId:string}){
 const {features,moderation,error,reload}=useLiveFeatures(userId);
 if(error)return <View style={{gap:12}}><Text style={s.body}>{error}</Text><Button label="Riprova le impostazioni" secondary onPress={reload}/></View>;
 if(!features)return <Text style={s.body}>Caricamento delle impostazioni…</Text>;
 return <View key={userId} style={{gap:24}}>{features.push?<NativePushPanel userId={userId}/>:null}{features.notifications?<NotificationInbox/>:null}{features.matching?<PreferencesPanel/>:null}{features.community?<SecurityPanel/>:null}{features.community&&moderation?<ModerationPanel/>:null}</View>;
}
