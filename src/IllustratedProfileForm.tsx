import React,{useState} from 'react';
import {View,Text,TextInput} from 'react-native';
import {Button,C,s} from './ui';
import {useIllustratedProfileDraft} from './illustrated-profile-form.mjs';
export function IllustratedProfileForm({demo=false}:{demo?:boolean}) {
 const [open,setOpen]=useState(false);
 const draft=useIllustratedProfileDraft();
 const ids=['portrait',...Array.from({length:5},(_,i)=>`interest-${i+1}`)];
 return <View style={[s.card,{padding:25,gap:18}]}>
  <Text style={[s.title,{fontSize:28,lineHeight:34}]}>Raccontati con le immagini</Text>
  <Text style={s.body}>Un ritratto facoltativo e fino a cinque scene dedicate ai tuoi interessi. Le immagini saranno create a partire dalle tue descrizioni.</Text>
  <Text style={s.body}>{demo?'Prova con descrizioni inventate, senza inserire dati personali. ':''}Questa è una bozza temporanea: i testi non vengono salvati con il profilo e si cancellano uscendo dalla schermata. La generazione delle immagini non è ancora disponibile.</Text>
  <Button label={open?'Chiudi le descrizioni':'Prepara le descrizioni'} secondary onPress={()=>setOpen(value=>!value)}/>
  {open?<View style={{gap:24}}>
   {ids.map((id,index)=>{
    const label=index===0?'Ritratto · facoltativo':`Interesse ${index} · facoltativo`;
    const confirmed=draft.isConfirmed(id);
    return <View key={id} style={{gap:9}}>
     <Text style={s.label}>{label}</Text>
     <TextInput accessibilityLabel={label} style={[s.input,{minHeight:100,textAlignVertical:'top'}]} multiline maxLength={1000} accessibilityHint={draft.errorId===id?draft.error:undefined}
      value={draft.fields[id]} onChangeText={text=>draft.setText(id,text)}
      placeholder={index===0?'Descrivi aspetto, capelli e abbigliamento.':'Descrivi un interesse e la scena che vorresti vedere.'}/>
     {draft.errorId===id?<Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[s.body,{color:C.red}]}>{draft.error}</Text>:null}
     <Text style={[s.body,{fontSize:13}]}>{draft.fields[id].length}/1000 caratteri</Text>
     <Button label={confirmed?'Descrizione confermata':`Conferma ${index===0?'il ritratto':`l’interesse ${index}`}`} secondary
      disabled={confirmed||!draft.fields[id].trim()} onPress={()=>draft.confirm(id)}/>
     {confirmed?<Text accessibilityLiveRegion="polite" style={[s.body,{color:C.ink}]}>Testo confermato. Puoi modificarlo e confermarlo di nuovo.</Text>:null}
    </View>;
   })}
  </View>:null}
 </View>;
}
