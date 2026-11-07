import React,{useCallback,useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Pressable,Text,TextInput,View} from 'react-native';
import {api} from './auth';
import {Button,Chip,C,s} from './ui';
import {CITIES,INTERESTS} from './fixtures';
import {EventCover} from './EventCover';
import {ChatPanel,SafetyActions} from './SocialTools';
type Group={id:string;organizerId:string;title:string;description:string;city:string;category:string;startsAt:string;place:string;cost:string;capacity:number;memberCount:number;cancelled:boolean;ownRole:'organizer'|'member'|'pending'|'visitor';members?:{userId:string;name:string}[];requests?:{userId:string;name:string;note:string;state:string}[]};
type Form={title:string;description:string;city:string;category:string;date:string;time:string;place:string;cost:string;capacity:string;publicPlace:boolean};
const empty=():Form=>({title:'',description:'',city:'Bologna',category:'All’aperto',date:'',time:'',place:'',cost:'Gratuito',capacity:'6',publicPlace:false});
const explain=(e:unknown)=>e instanceof Error?e.message:'Operazione non disponibile. Riprova.';
function localDate(date:string,time:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))throw Error('Usa data AAAA-MM-GG e ora HH:MM.');
 const [year,month,day]=date.split('-').map(Number),[hours,minutes]=time.split(':').map(Number),d=new Date(year,month-1,day,hours,minutes);
 if(d.getFullYear()!==year||d.getMonth()!==month-1||d.getDate()!==day||d.getHours()!==hours||d.getMinutes()!==minutes)throw Error('Controlla che data e ora siano valide.');
 return d.toISOString();
}
export function LiveGroups({mine=false}:{mine?:boolean}){
 const [groups,setGroups]=useState<Group[]>([]),[selected,setSelected]=useState<Group|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[creating,setCreating]=useState(false),[form,setForm]=useState<Form>(empty),[note,setNote]=useState('');
 const operation=useRef(false),epoch=useRef(0);
 const load=useCallback(async()=>{const version=++epoch.current;setLoading(true);setGroups([]);try{const data=await api('/api/groups'+(mine?'?mine=true':''));if(epoch.current===version)setGroups(data.groups);}catch(e){if(epoch.current===version)setError(explain(e));}finally{if(epoch.current===version)setLoading(false);}},[mine]);
 useEffect(()=>{setSelected(null);setError('');setNotice('');setCreating(false);setNote('');setForm(empty());void load();return()=>{epoch.current++;};},[load]);
 const run=async(action:()=>Promise<void>)=>{if(operation.current)return;operation.current=true;setBusy(true);setError('');setNotice('');try{await action();}catch(e){setSelected(null);setError(explain(e));}finally{operation.current=false;setBusy(false);}};
 const open=(id:string)=>run(async()=>{setSelected(null);setNote('');const data=await api('/api/groups/'+id);setSelected(data.group);});
 const act=(action:string,body:unknown={})=>{if(!selected)return;const id=selected.id;void run(async()=>{await api(`/api/groups/${id}/${action}`,'POST',body);setSelected(null);setNote('');await load();if(!['leave','cancel'].includes(action)){const data=await api('/api/groups/'+id);setSelected(data.group);}setNotice(({request:'Richiesta inviata. Attendi la risposta di chi organizza.',approve:'Partecipazione approvata.',reject:'Richiesta rifiutata.',leave:'Hai lasciato l’attività.',cancel:'Attività annullata.'} as Record<string,string>)[action]);});};
 const field=(key:keyof Form,label:string,maxLength=140,multiline=false)=> <View style={{gap:5}}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} editable={!busy} value={String(form[key])} onChangeText={value=>setForm(f=>({...f,[key]:value}))} maxLength={maxLength} multiline={multiline} style={[s.input,multiline?{minHeight:90,textAlignVertical:'top'}:{}]}/></View>;
 const create=()=>void run(async()=>{const startsAt=localDate(form.date,form.time);if(!/^\d+$/.test(form.capacity))throw Error('Inserisci un numero di posti da 2 a 20.');const data=await api('/api/groups','POST',{title:form.title,description:form.description,city:form.city,category:form.category,startsAt,place:form.place,publicPlace:form.publicPlace,cost:form.cost,capacity:Number(form.capacity)});setCreating(false);setForm(empty());await load();setSelected((await api('/api/groups/'+data.group.id)).group);setNotice('Attività creata. Sei incluso nei posti disponibili.');});
 return <View style={{gap:18}}>
  <Text style={s.eyebrow}>{mine?'Le mie balotte':'Attività reali'}</Text>
  <Text style={s.title}>{mine?'Organizziamo?':'Facciamo un giro?'}</Text>
  <Text style={s.body}>Attività proposte dalle persone iscritte. Partecipazione su richiesta; nessuna prenotazione o pagamento automatico.</Text>
  {error?<Text accessibilityRole="alert" style={{color:C.red}}>{error}</Text>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={s.body}>{notice}</Text>:null}
  {busy?<ActivityIndicator accessibilityLabel="Operazione in corso" color={C.red}/>:null}
  {selected?<View style={[s.card,{padding:18,gap:14}]}>
   <Button label="Torna alle attività" secondary disabled={busy} onPress={()=>{setSelected(null);setNote('');setError('');setNotice('');}}/>
   <EventCover category={selected.category} title={selected.title}/>
   <Text style={s.title}>{selected.title}</Text>
   <Text style={s.body}>{selected.description}</Text>
   <Text style={s.body}>{selected.city} · {new Date(selected.startsAt).toLocaleString('it-IT',{dateStyle:'medium',timeStyle:'short'})}</Text>
   <Text style={s.body}>{selected.place} · {selected.cost}</Text>
   <Text style={s.body}>{selected.memberCount}/{selected.capacity} posti, incluso chi organizza</Text>
   {selected.cancelled?<Text style={{color:C.red}}>Attività annullata</Text>:null}
   {selected.members?<View style={{gap:5}}><Text style={s.label}>Partecipanti approvati</Text>{selected.members.map(member=><Text key={member.userId} style={s.body}>{member.name}</Text>)}</View>:null}
   {selected.ownRole==='pending'?<Text style={s.body}>Richiesta in attesa di approvazione. La chat si apre dopo l’approvazione.</Text>:null}
   {selected.ownRole==='visitor'&&!selected.cancelled&&Date.parse(selected.startsAt)>Date.now()?<View style={{gap:12}}>{selected.memberCount>=selected.capacity?<Text style={s.body}>I posti sono esauriti.</Text>:<><TextInput accessibilityLabel="Nota per chi organizza" placeholder="Una nota per chi organizza (facoltativa)" value={note} editable={!busy} onChangeText={setNote} maxLength={500} multiline style={s.input}/><Button label="Chiedi di partecipare" disabled={busy} onPress={()=>act('request',{note})}/></>}</View>:null}
   {selected.ownRole==='organizer'?<View style={{gap:12}}><Text style={s.label}>Richieste di partecipazione</Text>{!selected.requests?.length?<Text style={s.body}>Nessuna richiesta in attesa.</Text>:selected.requests.map(person=><View key={person.userId} style={{gap:8,borderTopWidth:1,borderTopColor:C.line,paddingTop:12}}><Text style={s.label}>{person.name}</Text><Text style={s.body}>{person.note||'Nessuna nota.'}</Text>{!selected.cancelled?<><Button label="Approva" disabled={busy||selected.memberCount>=selected.capacity} onPress={()=>act('approve',{userId:person.userId})}/><Button label="Rifiuta" secondary disabled={busy} onPress={()=>act('reject',{userId:person.userId})}/></>:null}</View>)}</View>:null}
   {!selected.cancelled&&['organizer','member'].includes(selected.ownRole)?<ChatPanel kind="group" id={selected.id}/>:null}
   <SafetyActions groupId={selected.id}/>
   {selected.ownRole==='member'?<Button label="Lascia l’attività" secondary disabled={busy} onPress={()=>act('leave')}/>:null}
   {selected.ownRole==='organizer'&&!selected.cancelled?<Button label="Annulla l’attività" secondary disabled={busy} onPress={()=>act('cancel')}/>:null}
  </View>:creating?<View style={[s.card,{padding:18,gap:14}]}>
   <Text style={s.eyebrow}>Nuova attività</Text>
   {field('title','Titolo')}{field('description','Descrizione',2000,true)}
   <Text style={s.label}>Provincia</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{CITIES.slice(1).map(city=><Chip key={city} label={city} active={city===form.city} onPress={()=>{if(!busy)setForm(f=>({...f,city}));}}/>)}</View>
   <Text style={s.label}>Categoria</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{INTERESTS.slice(1).map(category=><Chip key={category} label={category} active={category===form.category} onPress={()=>{if(!busy)setForm(f=>({...f,category}));}}/>)}</View>
   {field('date','Data (AAAA-MM-GG)',10)}{field('time','Ora locale (HH:MM)',5)}
   <Text style={s.body}>Scegli una data futura entro 180 giorni. L’orario segue il fuso del tuo dispositivo.</Text>
   {field('place','Luogo pubblico e punto di ritrovo',240)}
   <Pressable accessibilityRole="checkbox" aria-checked={form.publicPlace} accessibilityState={{checked:form.publicPlace,disabled:busy}} disabled={busy} onPress={()=>setForm(f=>({...f,publicPlace:!f.publicPlace}))}><Text style={s.body}>{form.publicPlace?'☑':'☐'} Confermo che il ritrovo è in un luogo pubblico.</Text></Pressable>
   {field('cost','Costo previsto (anche Gratuito)')}{field('capacity','Posti totali, incluso chi organizza (2–20)',2)}
   <Button label="Crea attività" disabled={busy||!form.publicPlace} onPress={create}/><Button label="Chiudi" secondary disabled={busy} onPress={()=>setCreating(false)}/>
  </View>:<>
   {mine?<Button label="Proponi una balotta" disabled={busy} onPress={()=>{setCreating(true);setError('');setNotice('');}}/>:null}
   <Button label="Aggiorna attività" secondary disabled={busy||loading} onPress={()=>{setError('');void load();}}/>
   {loading?<ActivityIndicator color={C.red} accessibilityLabel="Caricamento attività"/>:!groups.length?<Text style={s.body}>{mine?'Non hai ancora attività o richieste in attesa. Proponi la prima balotta o scopri quelle disponibili.':'Non ci sono attività disponibili. Torna a controllare più avanti.'}</Text>:groups.map(group=><View key={group.id} style={[s.card,{gap:12,paddingBottom:16}]}><EventCover category={group.category} title={group.title}/><View style={{paddingHorizontal:16,gap:10}}><Text style={[s.title,{fontSize:28,lineHeight:34}]}>{group.title}</Text><Text style={s.body}>{group.city} · {new Date(group.startsAt).toLocaleString('it-IT',{dateStyle:'medium',timeStyle:'short'})}</Text><Text style={s.body}>{group.memberCount}/{group.capacity} posti · {group.cost}{group.cancelled?' · Annullata':group.ownRole==='pending'?' · Richiesta in attesa':''}</Text><Button label="Apri attività" secondary disabled={busy} onPress={()=>void open(group.id)}/></View></View>)}
  </>}
 </View>;
}
