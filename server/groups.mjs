import {presentGroup} from './groups-store.mjs';
const cities=new Set(['Bologna','Modena','Reggio Emilia','Parma','Piacenza','Ferrara','Ravenna','Forlì-Cesena','Rimini']);
const categories=new Set(['All’aperto','Sport','Mare','Cultura','A tavola','Musica','Giochi','Creatività','Natura','Animali','Lingue','Solidarietà','Tecnologia','Motori','Benessere','Socialità','Altro']);
const error=(message,status)=>Response.json({error:message},{status});
const object=b=>b!==null&&typeof b==='object'&&!Array.isArray(b);
export function validateGroup(body){
 const keys=['title','description','city','category','startsAt','place','publicPlace','cost','capacity'];
 if(!object(body)||Object.keys(body).some(k=>!keys.includes(k))||body.publicPlace!==true||!cities.has(body.city)||!categories.has(body.category)||!Number.isInteger(body.capacity)||body.capacity<2||body.capacity>20)throw Error('Controlla provincia, categoria, luogo pubblico e posti da 2 a 20.');
 for(const [key,max] of [['title',140],['description',2000],['place',240],['cost',140]])if(typeof body[key]!=='string'||!body[key].trim()||body[key].length>max)throw Error('Completa titolo, descrizione, luogo pubblico e costo.');
 const m=typeof body.startsAt==='string'&&body.startsAt.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/),time=Date.parse(body.startsAt),now=Date.now();
 if(!m||+m[2]<1||+m[2]>12||+m[3]<1||+m[3]>new Date(Date.UTC(+m[1],+m[2],0)).getUTCDate()||+m[4]>23||+m[5]>59||+m[6]>59||!Number.isFinite(time)||time<=now||time>now+180*86400000)throw Error('Inserisci data e ora future valide, entro 180 giorni.');
 return {...body,title:body.title.trim(),description:body.description.trim(),place:body.place.trim(),cost:body.cost.trim(),startsAt:new Date(time).toISOString()};
}
export function createGroupRoutes({store,enabled}){
 return async({path,request,user,jsonBody})=>{
  if(!/^\/api\/groups(?:\/|$)/.test(path))return null;
  if(!enabled)return error('Le attività reali sono ancora in preparazione.',503);
  if(!user)return error('Accedi per continuare.',401);
  const match=path.match(/^\/api\/groups(?:\/([A-Za-z0-9-]{1,80}))?(?:\/(request|approve|reject|leave|cancel))?$/);
  if(!match)return error('Attività non trovata.',404);
  const [,id,action]=match,method=request.method,groups=store.groups;
  // Permit exit/cancellation even if eligibility or a block changed.
  const exiting=method==='POST'&&['leave','cancel'].includes(action);
  if(!exiting&&(await store.getProfile(user.id))?.adult!==true)return error('Completa il profilo e conferma la maggiore età.',403);
  if(!id){
   if(method==='GET')return Response.json({groups:(await groups.list(user.id,new URL(request.url).searchParams.get('mine')==='true')).map(presentGroup)});
   if(method!=='POST')return error('Metodo non consentito.',405);
   let body;try{body=validateGroup(await jsonBody(request));}catch(e){return error(e.message,400);}
   const created=await groups.create(user.id,body);if(!created)return error('Il profilo non è idoneo alle attività reali.',403);
   const row=await groups.get(user.id,created.id);return row?Response.json({group:presentGroup(row)},{status:201}):error('Attività non più disponibile. Ricarica.',409);
  }
  if(exiting){const body=await jsonBody(request);if(!object(body)||Object.keys(body).length)return error('Richiesta non valida.',400);if(action==='cancel'){const row=await groups.get(user.id,id);if(row&&row.organizer_id!==user.id)return error('Solo chi organizza può annullare.',403);}return await groups[action](user.id,id)?Response.json({ok:true}):error('Operazione non disponibile. Ricarica.',409);}
  const row=await groups.get(user.id,id);if(!row)return error('Attività non trovata.',404);
  if(!action&&method==='GET'){
   const group=presentGroup(row);
   if(['organizer','member'].includes(group.ownRole))group.members=await groups.members(user.id,id);
   if(group.ownRole==='organizer')group.requests=await groups.requests(user.id,id);
   return Response.json({group});
  }
  if(method!=='POST'||!action)return error('Metodo non consentito.',405);
  const body=await jsonBody(request);if(!object(body))return error('Richiesta non valida.',400);
  let result;
  if(action==='request'){
   if(Object.keys(body).some(k=>k!=='note')||typeof body.note!=='string'||body.note.length>500)return error('Scrivi una nota di massimo 500 caratteri.',400);
   result=await groups.request(user.id,id,body.note.trim());
  }else if(action==='approve'||action==='reject'){
   if(row.organizer_id!==user.id)return error('Solo chi organizza gestisce le richieste.',403);
   if(Object.keys(body).length!==1||typeof body.userId!=='string'||!body.userId||body.userId.length>80)return error('Richiedente non valido.',400);
   result=await groups[action](user.id,id,body.userId);
  }
  return result?Response.json({ok:true}):error('L’attività o la richiesta è cambiata, oppure i posti sono esauriti. Ricarica prima di riprovare.',409);
 };
}
