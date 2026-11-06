import {EXTRA_THEMES} from './interest-themes.mjs';
/** A deterministic illustrated vocabulary; it never calls a model or a URL. */
export const COVER_THEMES={
 climbing:{label:'Arrampicata',categories:['Sport'],file:'assets/events/climbing.jpg',words:['arrampicata','boulder','bouldering','climbing']},
 football:{label:'Calcio e calcetto',categories:['Sport'],file:'assets/events/football.jpg',words:['calcio','calcetto','football','futsal']},
 tennis:{label:'Tennis',categories:['Sport'],file:'assets/events/tennis.jpg',words:['tennis']},
 padel:{label:'Padel',categories:['Sport'],file:'assets/events/padel.jpg',words:['padel']},
 volleyball:{label:'Pallavolo e beach volley',categories:['Sport','Mare'],file:'assets/events/volleyball.jpg',words:['pallavolo','volley','volleyball','beachvolley']},
 running:{label:'Corsa e camminata sportiva',categories:['Sport','All’aperto'],file:'assets/events/running.jpg',words:['corsa','running','jogging','camminata sportiva']},
 yoga:{label:'Yoga e movimento dolce',categories:['Sport','All’aperto','Benessere'],file:'assets/events/yoga.jpg',words:['yoga','stretching']},
 water:{label:'Nuoto e mare',categories:['Sport','Mare'],file:'assets/events/water.jpg',words:['nuoto','nuotare','nuotata','swimming']},
 bikes:{label:'Bici e cicloturismo',categories:['Sport','All’aperto'],file:'assets/bici-riviera.jpg',words:['bici','bicicletta','biciclette','ciclismo','cicloturismo','cycling','mtb']},
 hills:{label:'Passeggiate e colli',categories:['All’aperto'],file:'assets/musica-colli.jpg',words:['passeggiata','passeggiate','trekking','camminata','camminate','escursione','escursioni','colli']},
 beach:{label:'Spiaggia e racchettoni',categories:['Mare','Sport','All’aperto'],file:'assets/spiaggia-complicita.jpg',words:['spiaggia','racchettoni','beach tennis']},
 table:{label:'Tavolate e giochi',categories:['A tavola','Giochi'],file:'assets/tavolate-giochi.jpg',words:[]},
 music:{label:'Musica da condividere',categories:['Musica'],file:'assets/musica-colli.jpg',words:[]},
 culture:{label:'Arte, libri e fotografia',categories:['Cultura'],file:'assets/fotografia-fumetti.jpg',words:[]},
 community:{label:'Persone e nuove passioni',categories:['Sport','Socialità','Altro'],file:'assets/events/community.jpg',words:[]},
 ...EXTRA_THEMES,
};
const normal=s=>typeof s==='string'?s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim():'';
const categoryMatches=(a,b)=>normal(a)===normal(b);
export function choicesForCategory(category){return Object.entries(COVER_THEMES).filter(([,v])=>v.categories.some(c=>categoryMatches(c,category))).map(([key,v])=>({key,label:v.label}));}
/** @typedef {{category?:string,activityType?:string,title?:string,interests?:string[]}} CoverInput */
/** @param {CoverInput} input */
export function resolveCoverDecision({category='',activityType='',title='',interests=[]}={}) {
 const choices=choicesForCategory(category),decision=(key,source)=>({key,source});
 if(choices.some(c=>c.key===activityType)) return decision(activityType,'selected');
 // Personal affinities are hints only when the proposal has no title yet.
 const titleText=normal(title),cat=normal(category);
 const text=titleText||normal((Array.isArray(interests)?interests:[]).filter(x=>typeof x==='string').join(' '));
 if(cat==='sport'&&/\bcalcio balilla\b/.test(text))return decision('table','keyword');
 if(cat==='sport'&&/\b(tennis da tavolo|tennistavolo|ping pong|pingpong|badminton)\b/.test(text))return decision('community','fallback');
 if(['sport','mare','allaperto'].includes(cat)&&/\bbeach tennis\b/.test(text))return decision('beach','keyword');
 const candidates=[...choices].sort((a,b)=>Number(b.key in EXTRA_THEMES)-Number(a.key in EXTRA_THEMES));
 for(const {key} of candidates){
  if(COVER_THEMES[key].words.some(word=>new RegExp('(?:^| )'+normal(word)+'(?: |$)').test(text)))return decision(key,'keyword');
 }
 if(['giochi','a tavola'].includes(cat))return decision('table','category');
 if(cat==='cultura')return decision('culture','category');
 if(cat==='musica')return decision('music','category');
 if(cat==='allaperto')return decision('hills','category');
 if(cat==='mare')return decision('beach','category');
 return decision('community','fallback');
}
/** @param {CoverInput} input */
export function resolveCover(input={}) {return resolveCoverDecision(input).key;}
export const INTEREST_LABELS=[...new Set(['Passeggiate','Fotografia','Musica dal vivo','Arrampicata','Cucina','Giochi da tavolo','Bici','Mare','Arte','Lettura',...Object.entries(COVER_THEMES).filter(([key])=>key!=='community').map(([,theme])=>theme.label)])];
