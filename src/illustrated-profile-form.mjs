import {useReducer} from 'react';
import {createIllustratedProfile} from './illustrated-profile.mjs';
const IDS=['portrait',...Array.from({length:5},(_,i)=>`interest-${i+1}`)];
function initial(){return {fields:Object.fromEntries(IDS.map(id=>[id,''])),confirmed:{},error:'',errorId:null};}
function reducer(state,action){
 if(!IDS.includes(action.id)) return {...state,error:'Descrizione non valida.',errorId:action.id};
 if(action.type==='change'){
  if(typeof action.text!=='string'||action.text.length>1000) return {...state,error:'Usa al massimo 1000 caratteri per descrizione.',errorId:action.id};
  if(action.text===state.fields[action.id]) return state;
  const confirmed={...state.confirmed};delete confirmed[action.id];
  return {fields:{...state.fields,[action.id]:action.text},confirmed,error:'',errorId:null};
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
   return {...state,confirmed:{...state.confirmed,[action.id]:text},error:'',errorId:null};
  }catch(error){return {...state,error:error.message,errorId:action.id};}
 }
 return state;
}
/** Ephemeral draft: deliberately no network, storage, or image generation. */
export function useIllustratedProfileDraft(){
 const [state,dispatch]=useReducer(reducer,undefined,initial);
 return {fields:state.fields,error:state.error,errorId:state.errorId,
  setText:(id,text)=>dispatch({type:'change',id,text}),
  confirm:id=>dispatch({type:'confirm',id}),
  isConfirmed:id=>Boolean(state.fields[id]?.trim()&&state.confirmed[id]===state.fields[id].trim())};
}
