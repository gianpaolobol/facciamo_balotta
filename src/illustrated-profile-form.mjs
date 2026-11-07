import {useEffect,useReducer,useRef,useState} from 'react';
import {ILLUSTRATION_IDS as IDS,emptyIllustratedDraft,validateIllustratedSnapshot} from './illustrated-draft.mjs';
import {createIllustratedProfile} from './illustrated-profile.mjs';
function initial(persistent=false){return {...emptyIllustratedDraft(),error:'',errorId:null,version:0,dirty:false,loadState:persistent?'loading':'ready',saving:false,syncError:'',notice:''};}
function reducer(state,action){
 if(action.type==='loading') return {...state,loadState:'loading',syncError:'',notice:''};
 if(action.type==='loaded') return {...initial(),...action.snapshot.draft,version:action.snapshot.version};
 if(action.type==='loadError') return {...state,loadState:'error',syncError:action.message};
 if(action.type==='saving') return {...state,saving:true,syncError:'',notice:''};
 if(action.type==='saved') return {...state,saving:false,dirty:false,version:action.version,notice:'Bozza salvata.'};
 if(action.type==='saveError') return {...state,saving:false,syncError:action.message};
 if(state.loadState!=='ready'||state.saving) return state;
 if(!IDS.includes(action.id)) return {...state,error:'Descrizione non valida.',errorId:action.id};
 if(action.type==='change'){
  if(typeof action.text!=='string'||action.text.length>1000) return {...state,error:'Usa al massimo 1000 caratteri per descrizione.',errorId:action.id};
  if(action.text===state.fields[action.id]) return state;
  const confirmed={...state.confirmed};delete confirmed[action.id];
  return {...state,fields:{...state.fields,[action.id]:action.text},confirmed,error:'',errorId:null,dirty:true,notice:''};
 }
 if(action.type==='confirm'){
  try{
   const text=state.fields[action.id].trim();
   if(!text) throw new Error('Scrivi una descrizione prima di confermarla.');
   if(action.id==='portrait') createIllustratedProfile({portrait:text});
   else {
    for(const id of IDS.slice(1)) {
     if(id!==action.id&&state.fields[id].trim()) createIllustratedProfile({interests:[text,state.fields[id]]});
    }
   }
   return {...state,confirmed:{...state.confirmed,[action.id]:text},error:'',errorId:null,dirty:true,notice:''};
  }catch(error){return {...state,error:error.message,errorId:action.id};}
 }
 return state;
}
/** Demo stays local; authenticated callers supply explicit load/save functions. */
export function useIllustratedProfileDraft({loadDraft,saveDraft}={}){
 const [state,dispatch]=useReducer(reducer,Boolean(loadDraft),initial);
 const [reloadTick,setReloadTick]=useState(0);
 const alive=useRef(true),saveLock=useRef(false),loadEpoch=useRef(0);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{
  if(!loadDraft) return;
  let active=true;loadEpoch.current++;dispatch({type:'loading'});
  Promise.resolve().then(loadDraft).then(value=>{
   const snapshot=validateIllustratedSnapshot(value);
   if(active) dispatch({type:'loaded',snapshot});
  }).catch(error=>{if(active) dispatch({type:'loadError',message:error.message||'Impossibile caricare la bozza.'});});
  return()=>{active=false;};
 },[loadDraft,reloadTick]);
 async function save(){
  if(!saveDraft||!loadDraft||state.loadState!=='ready'||!state.dirty||saveLock.current) return;
  saveLock.current=true;const epoch=loadEpoch.current;dispatch({type:'saving'});
  try{
   const result=validateIllustratedSnapshot(await saveDraft({draft:{fields:state.fields,confirmed:state.confirmed},version:state.version}));
   if(alive.current&&epoch===loadEpoch.current) dispatch({type:'saved',version:result.version});
  }catch(error){if(alive.current&&epoch===loadEpoch.current) dispatch({type:'saveError',message:error.message||'Impossibile salvare la bozza.'});}
  finally{saveLock.current=false;}
 }
 return {...state,save,
  reload:()=>{if(loadDraft&&!saveLock.current)setReloadTick(value=>value+1);},
  setText:(id,text)=>dispatch({type:'change',id,text}),
  confirm:id=>dispatch({type:'confirm',id}),
  isConfirmed:id=>Boolean(state.fields[id]?.trim()&&state.confirmed[id]===state.fields[id].trim())};
}
