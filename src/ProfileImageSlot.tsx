import React,{useEffect,useRef,useState} from 'react';
import {View,Text,Image} from 'react-native';
import {api} from './auth';
import {Button,C,s} from './ui';
type GeneratedImage={id:string;dataUri:string;approved:boolean};
type Result={image:GeneratedImage|null;approvedId:string|null};
export function ProfileImageSlot({slot,version,description,confirmed,dirty,demo,enabled,busy,onBusy}:{slot:string;version:number;description:string;confirmed:boolean;dirty:boolean;demo:boolean;enabled:boolean;busy:boolean;onBusy:(slot:string|null)=>void}){
 const [result,setResult]=useState<Result>({image:null,approvedId:null});const [error,setError]=useState('');const [working,setWorking]=useState(false);
 const seq=useRef(0),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{
  const request=++seq.current;let active=true;setResult({image:null,approvedId:null});setError('');
  if(!demo&&confirmed&&!dirty)api('/api/illustrated-profile/images/'+slot).then(value=>{if(active&&request===seq.current)setResult(value);}).catch(e=>{if(active&&request===seq.current)setError(e.message);});
  return()=>{active=false;seq.current++;};
 },[slot,version,description,confirmed,dirty,demo]);
 if(demo)return null;
 const ready=confirmed&&!dirty;
 const image=ready?result.image:null;
 async function action(name:'generate'|'approve'|'discard'){
  if(busy||!ready)return;const request=++seq.current;setWorking(true);onBusy(slot);setError('');
  try{const value=await api('/api/illustrated-profile/'+name,'POST',{slot,version,...(name==='generate'?{}:{id:image?.id})});if(mounted.current&&request===seq.current)setResult(value);}
  catch(e){if(mounted.current&&request===seq.current)setError((e as Error).message);}
  finally{if(mounted.current){setWorking(false);onBusy(null);}}
 }
 return <View style={{gap:12}}>
  {image?<><Image accessibilityLabel={image.approved?'Immagine approvata':'Anteprima da approvare'} source={{uri:image.dataUri}} style={{width:'100%',aspectRatio:1,borderRadius:12}} resizeMode="contain"/>
   <Text style={s.body}>{image.approved?'Immagine approvata.':'Anteprima: approvala oppure rigenera solo questa immagine.'}</Text>
   {!image.approved?<Button label="Approva questa immagine" secondary disabled={busy} onPress={()=>void action('approve')}/>:null}
   {!image.approved?<Button label={result.approvedId?'Mantieni l’immagine precedente':'Scarta questa anteprima'} secondary disabled={busy} onPress={()=>void action('discard')}/>:null}
  </>:null}
  <Button label={working?'Elaborazione…':image?'Rigenera questa immagine':slot==='portrait'?'Genera il ritratto':'Genera l’immagine dell’interesse'} secondary disabled={busy||!ready||!enabled} onPress={()=>void action('generate')}/>
  {!ready?<Text style={s.body}>Conferma la descrizione e salva la bozza prima di generare.</Text>:null}
  {error?<Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[s.body,{color:C.red}]}>{error}</Text>:null}
 </View>;
}
