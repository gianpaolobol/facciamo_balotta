import React,{useState} from 'react';
import {View,Text} from 'react-native';
import {DEMO_PERSON} from '../fixtures';
import {Button,Chip,C,s} from '../ui';
import {InkIcon} from '../InkIcon';
import {EventCover} from '../EventCover';
import {confirmDate,reviseDate,matchReasons} from '../domain.mjs';
const people=[DEMO_PERSON,{id:'matteo',name:'Matteo',age:33,city:'Modena',initials:'M',interests:['Passeggiate','Giochi da tavolo','Fotografia'],bio:'Mi incuriosiscono le persone e i piccoli programmi improvvisati. Mi trovi fra una passeggiata, una fotografia e un gioco da tavolo.'}];
const fresh=(id:string)=>({id:'demo-date',version:1,members:['you',id],confirmations:[] as string[],status:'proposed',activity:'Una mostra e due chiacchiere',startsAt:'Sabato 14 novembre · ore 16:00',place:'Spazio pubblico a Bologna · da scegliere insieme',cost:'Da concordare prima della conferma'});
export function Pair({initialStep=0}:{initialStep?:0|2}) {
 const [index,setIndex]=useState(0),person=people[index];
 const [step,setStep]=useState<number>(initialStep),[proposal,setProposal]=useState(()=>fresh(people[0].id)),[alternate,setAlternate]=useState(false);
 const shared=matchReasons({interests:['Fotografia','Passeggiate','Giochi da tavolo']},person);
 const reset=()=>{setStep(0);setProposal(fresh(person.id));setAlternate(false);};
 const next=()=>{const i=(index+1)%people.length;setIndex(i);setProposal(fresh(people[i].id));setAlternate(false);setStep(0);};
 return <View style={{gap:22,maxWidth:740,width:'100%',alignSelf:'center'}}>
  <View><Text style={s.eyebrow}>UNA PROPOSTA AUTOMATICA PER TE · DEMO</Text><Text style={[s.title,{marginTop:8}]}>Una persona da conoscere.</Text><Text style={s.body}>L’app propone una persona. Tu scegli se fare il primo passo.</Text></View>
  {step===0?<View style={[s.card,{boxShadow:'5px 6px 0px #252923'}]}>
   <View style={{backgroundColor:C.violet,padding:18,alignItems:'center',gap:5}}><InkIcon name="person" size={94}/><Text style={{fontFamily:'Kalam_400Regular',fontSize:16,color:C.ink}}>Un incontro comincia con la curiosità.</Text></View>
   <View style={{padding:22,gap:15}}>
    <View><Text style={s.title}>{person.name}, {person.age}</Text><Text style={s.body}>{person.city} · profilo interamente fittizio</Text></View>
    <Text style={s.body}>{person.bio}</Text>
    <View style={{flexDirection:'row',gap:7,flexWrap:'wrap'}}>{person.interests.map(i=><Chip key={i} label={i}/>)}</View>
    <View style={{backgroundColor:C.lime,borderRadius:12,padding:14,borderWidth:1.5}}><Text style={{fontFamily:'BalottaInchiostro',fontSize:23}}>Perché questa proposta?</Text><Text style={[s.body,{color:C.ink,fontSize:13,marginTop:4}]}>{shared.join(' e ')}: passioni dichiarate che potete condividere. Questo esempio mostra il percorso; l’analisi IA reale non è attiva.</Text></View>
    <Button label="Sì, mi interessa" icon="heart" onPress={()=>setStep(1)}/>
    <Button label="Passo, grazie" icon="pass" secondary onPress={()=>setStep(3)}/>
   </View>
  </View>:null}
  {step===1?<View style={[s.card,{padding:25,gap:18,alignItems:'center'}]}><InkIcon name="pair" size={66}/><Text style={s.title}>Hai fatto il primo passo.</Text><Text style={[s.body,{textAlign:'center'}]}>L’app attende l’interesse dell’altra persona. Solo dopo due sì propone l’appuntamento.</Text><Text style={[s.eyebrow,{color:C.muted}]}>SIMULAZIONE CON PROFILI FITTIZI</Text><Button label="Simula l’interesse reciproco" icon="heart" onPress={()=>setStep(2)}/><Button label="Torna al profilo" secondary onPress={reset}/></View>:null}
  {step===3?<View style={[s.card,{padding:25,gap:18,alignItems:'center'}]}><InkIcon name="pass" size={64} color={C.red}/><Text style={s.title}>Passiamo oltre.</Text><Text style={[s.body,{textAlign:'center'}]}>Hai rifiutato questa proposta. Nella versione attiva l’app cercherà una persona diversa rispettando le tue preferenze.</Text><Button label="Un’altra proposta di esempio" icon="arrow" onPress={next}/></View>:null}
  {step===2?<View style={[s.card,{boxShadow:'5px 6px 0px #252923'}]}>
   <EventCover category={alternate?'All’aperto':'Cultura'} title={proposal.activity} height={210}/>
   <View style={{padding:23,gap:16}}><Text style={s.eyebrow}>{proposal.status==='confirmed'?'DUE SÌ, SI ESCE!':'VI INTERESSATE ENTRAMBI · ECCO UN’IDEA'}</Text><Text style={s.title}>{proposal.activity}</Text><Text style={{fontFamily:'ComicNeue_700Bold',fontSize:17,color:C.ink}}>{proposal.startsAt}</Text><Text style={s.body}>{proposal.place}{'\n'}Costo: {proposal.cost}</Text>
    <View style={{padding:14,backgroundColor:proposal.status==='confirmed'?C.lime:C.paper,borderRadius:12,borderWidth:1.5}}><Text style={s.body}>{proposal.status==='confirmed'?'Appuntamento di esempio confermato da entrambi. Nessuna prenotazione reale effettuata.':proposal.confirmations.includes('you')?'Hai confermato. Manca ancora la risposta di '+person.name+'.':'Confermate entrambi questa proposta per fissare l’incontro.'}</Text></View>
    {!proposal.confirmations.includes('you')?<Button label="Ci sono!" icon="heart" onPress={()=>setProposal(confirmDate(proposal,'you',proposal.version))}/>:null}
    {proposal.confirmations.includes('you')&&proposal.status!=='confirmed'?<Button label="Simula anche la sua conferma" icon="heart" onPress={()=>setProposal(confirmDate(proposal,person.id,proposal.version))}/>:null}
    <Button label="Cambiamo giorno o orario" icon="arrow" secondary onPress={()=>setProposal(reviseDate(proposal,{startsAt:proposal.startsAt.includes('14')?'Domenica 15 novembre · ore 16:00':'Sabato 14 novembre · ore 16:00'}))}/>
    <Button label="Preferisco un’altra attività" secondary onPress={()=>{setAlternate(!alternate);setProposal(reviseDate(proposal,{activity:alternate?'Una mostra e due chiacchiere':'Due passi tra i portici'}));}}/>
    <Button label="Non desidero proseguire" icon="pass" secondary onPress={reset}/><Text style={[s.body,{fontSize:11}]}>Ogni modifica azzera le conferme precedenti. In questo esempio puoi provare tutte le risposte.</Text>
   </View>
  </View>:null}
 </View>;
}
