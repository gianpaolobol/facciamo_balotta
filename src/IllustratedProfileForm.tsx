import React,{useState} from 'react';
import {View,Text,TextInput} from 'react-native';
import {Button,C,s} from './ui';
import {useIllustratedProfileDraft} from './illustrated-profile-form.mjs';
import {ILLUSTRATION_IDS} from './illustrated-draft.mjs';
import {api} from './auth';
const loadDraft=()=>api('/api/illustrated-profile');
const saveDraft=(body:unknown)=>api('/api/illustrated-profile','PUT',body);
export function IllustratedProfileForm({demo=false}:{demo?:boolean}) {
 const [open,setOpen]=useState(false);
 const [confirmReload,setConfirmReload]=useState(false);
 const draft=useIllustratedProfileDraft(demo?{}:{loadDraft,saveDraft});
 const blocked=draft.loadState!=='ready'||draft.saving;
 const ids=ILLUSTRATION_IDS;
 return <View style={[s.card,{padding:25,gap:18}]}>
  <Text style={[s.title,{fontSize:28,lineHeight:34}]}>Raccontati con le immagini</Text>
  <Text style={s.body}>Un ritratto facoltativo e fino a cinque scene dedicate ai tuoi interessi. Le immagini saranno create a partire dalle tue descrizioni.</Text>
  <Text style={s.body}>{demo?'Prova con descrizioni inventate, senza inserire dati personali. In demo i testi si cancellano uscendo dalla schermata.':'Salva la bozza per ritrovare descrizioni e conferme al prossimo accesso. Le modifiche non salvate si cancellano uscendo dalla schermata.'} La generazione delle immagini non è ancora disponibile.</Text>
  {draft.loadState==='loading'?<Text accessibilityLiveRegion="polite" style={s.body}>Caricamento della bozza salvata…</Text>:null}
  {draft.syncError?<View style={{gap:12}}><Text accessibilityRole="alert" style={[s.body,{color:C.red}]}>{draft.syncError}</Text>
   {confirmReload?<Text style={s.body}>Ricaricare sostituisce le modifiche locali con la bozza salvata. Premi di nuovo per confermare.</Text>:null}
   <Button label={confirmReload?'Conferma ricaricamento':'Ricarica la bozza salvata'} secondary disabled={draft.saving} onPress={()=>{if(draft.dirty&&!confirmReload){setConfirmReload(true);return;}setConfirmReload(false);draft.reload();}}/>
  </View>:null}
  <Button label={open?'Chiudi le descrizioni':'Prepara le descrizioni'} secondary onPress={()=>setOpen(value=>!value)}/>
  {open?<View style={{gap:24}}>
   {ids.map((id,index)=>{
    const label=index===0?'Ritratto · facoltativo':`Interesse ${index} · facoltativo`;
    const confirmed=draft.isConfirmed(id);
    return <View key={id} style={{gap:9}}>
     <Text style={s.label}>{label}</Text>
     <TextInput accessibilityLabel={label} style={[s.input,{minHeight:100,textAlignVertical:'top'}]} multiline maxLength={1000} editable={!blocked} accessibilityHint={draft.errorId===id?draft.error:undefined}
      value={draft.fields[id]} onChangeText={text=>draft.setText(id,text)}
      placeholder={index===0?'Descrivi aspetto, capelli e abbigliamento.':'Descrivi un interesse e la scena che vorresti vedere.'}/>
     {draft.errorId===id?<Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[s.body,{color:C.red}]}>{draft.error}</Text>:null}
     <Text style={[s.body,{fontSize:13}]}>{draft.fields[id].length}/1000 caratteri</Text>
     <Button label={confirmed?'Descrizione confermata':`Conferma ${index===0?'il ritratto':`l’interesse ${index}`}`} secondary
      disabled={blocked||confirmed||!draft.fields[id].trim()} onPress={()=>draft.confirm(id)}/>
     {confirmed?<Text accessibilityLiveRegion="polite" style={[s.body,{color:C.ink}]}>Testo confermato. Puoi modificarlo e confermarlo di nuovo.</Text>:null}
    </View>;
   })}
   {!demo?<View style={{gap:12}}>
    <Button label={draft.saving?'Salvataggio della bozza…':'Salva la bozza illustrata'} disabled={blocked||!draft.dirty} onPress={()=>{setConfirmReload(false);void draft.save();}}/>
    <Text accessibilityLiveRegion="polite" style={s.body}>{draft.notice||(draft.dirty?'Hai modifiche da salvare.':'Nessuna modifica da salvare.')}</Text>
   </View>:null}
  </View>:null}
 </View>;
}
