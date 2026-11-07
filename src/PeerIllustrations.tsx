import React,{useEffect,useRef,useState} from 'react';
import {Image,Text,View} from 'react-native';
import {api} from './auth';
import {Button,C,s} from './ui';

type ApprovedImage={id:string;slot:string;dataUri:string};
type SlotState={loading:boolean;image:ApprovedImage|null;error:boolean};
const interestSlots=['interest-1','interest-2','interest-3','interest-4','interest-5'];

// A new pairing gets fresh state immediately, before its first request resolves.
export function PeerIllustrations({pairId}:{pairId:string}){
 return <PairIllustrations key={pairId} pairId={pairId}/>;
}

function PairIllustrations({pairId}:{pairId:string}){
 const [slots,setSlots]=useState<Record<string,SlotState>>({}),[expanded,setExpanded]=useState(false);
 const requested=useRef(new Set<string>()),generation=useRef(pairId),active=useRef(false);
 const loadSlot=async(slot:string)=>{
  if(!active.current||requested.current.has(slot))return;
  requested.current.add(slot);
  const requestGeneration=generation.current;
  setSlots(current=>({...current,[slot]:{loading:true,image:null,error:false}}));
  try{
   const result=await api('/api/pairings/'+encodeURIComponent(pairId)+'/illustrations/'+slot);
   if(!active.current||requestGeneration!==generation.current)return;
   setSlots(current=>({...current,[slot]:{loading:false,image:result.image,error:false}}));
  }catch{
   if(!active.current||requestGeneration!==generation.current)return;
   setSlots(current=>({...current,[slot]:{loading:false,image:null,error:true}}));
  }
 };
 useEffect(()=>{
  generation.current=pairId;active.current=true;void loadSlot('portrait');
  return()=>{active.current=false;};
 },[pairId]);
 const toggleInterests=()=>{
  const next=!expanded;setExpanded(next);
  if(next)for(const slot of interestSlots)void loadSlot(slot);
 };
 const portrait=slots.portrait;
 const interestsLoading=expanded&&interestSlots.some(slot=>!slots[slot]||slots[slot].loading);
 const interestsError=expanded&&interestSlots.some(slot=>slots[slot]?.error);
 const noInterests=expanded&&!interestsLoading&&!interestsError&&interestSlots.every(slot=>!slots[slot]?.image);
 return <View style={{gap:12}}>
  {portrait?.image?<View style={{gap:7}}>
   <Image accessibilityLabel="Ritratto illustrato approvato" source={{uri:portrait.image.dataUri}} resizeMode="contain" style={{width:'100%',maxHeight:380,aspectRatio:1,borderRadius:12,backgroundColor:C.paper}}/>
   <Text style={[s.body,{fontSize:13}]}>Ritratto illustrato approvato dalla persona.</Text>
  </View>:portrait?.error?<Text accessibilityRole="alert" style={[s.body,{color:C.red}]}>Non è stato possibile caricare il ritratto illustrato.</Text>:portrait&&!portrait.loading?<Text style={s.body}>Nessun ritratto illustrato condiviso.</Text>:<Text style={s.body}>Caricamento del ritratto illustrato…</Text>}
  <Button label={expanded?'Nascondi le illustrazioni degli interessi':'Mostra le illustrazioni degli interessi'} secondary onPress={toggleInterests}/>
  {expanded?<View style={{gap:12}}>
   {interestsLoading?<Text accessibilityLiveRegion="polite" style={s.body}>Caricamento delle illustrazioni degli interessi…</Text>:null}
   {interestSlots.map((slot,index)=>slots[slot]?.image?<View key={slot} style={{gap:7}}>
    <Image accessibilityLabel={'Illustrazione dell’interesse '+(index+1)+' approvata'} source={{uri:slots[slot].image!.dataUri}} resizeMode="contain" style={{width:'100%',maxHeight:320,aspectRatio:1,borderRadius:12,backgroundColor:C.paper}}/>
    <Text style={[s.body,{fontSize:13}]}>Illustrazione dell’interesse {index+1} approvata dalla persona.</Text>
   </View>:null)}
   {interestsError?<Text accessibilityRole="alert" style={[s.body,{color:C.red}]}>Non è stato possibile caricare alcune illustrazioni degli interessi.</Text>:null}
   {noInterests?<Text style={s.body}>Nessuna illustrazione degli interessi condivisa.</Text>:null}
  </View>:null}
 </View>;
}
