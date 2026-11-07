export const ILLUSTRATION_IDS=Object.freeze(['portrait',...Array.from({length:5},(_,i)=>`interest-${i+1}`)]);
export function emptyIllustratedDraft(){return {fields:Object.fromEntries(ILLUSTRATION_IDS.map(id=>[id,''])),confirmed:{}};}
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
/** Validate editable text, not generated images. Unconfirmed drafts may be incomplete. */
export function validateIllustratedDraft(draft){
 if(!object(draft)||!object(draft.fields)||!object(draft.confirmed)) throw new Error('Controlla le descrizioni del profilo illustrato.');
 if(Object.keys(draft.fields).length!==ILLUSTRATION_IDS.length||Object.keys(draft.fields).some(id=>!ILLUSTRATION_IDS.includes(id))||Object.keys(draft.confirmed).some(id=>!ILLUSTRATION_IDS.includes(id))) throw new Error('Descrizioni non valide.');
 const result=emptyIllustratedDraft();const confirmedInterests=new Set();
 for(const id of ILLUSTRATION_IDS){
  const text=draft.fields[id];if(typeof text!=='string'||text.length>1000) throw new Error('Usa al massimo 1000 caratteri per descrizione.');
  result.fields[id]=text;
  if(Object.hasOwn(draft.confirmed,id)){
   if(!text.trim()||draft.confirmed[id]!==text.trim()) throw new Error('Conferma nuovamente il testo modificato.');
   if(id!=='portrait'){
    const normalized=text.trim().normalize('NFKC').toLocaleLowerCase('it-IT');
    if(confirmedInterests.has(normalized)) throw new Error('Conferma interessi distinti.');
    confirmedInterests.add(normalized);
   }
   result.confirmed[id]=text.trim();
  }
 }
 return result;
}
export function validateIllustratedSnapshot(value){
 if(!object(value)||!Number.isSafeInteger(value.version)||value.version<0) throw new Error('Versione della bozza non valida.');
 if(value.draft===null&&value.version===0) return {draft:emptyIllustratedDraft(),version:0};
 return {draft:validateIllustratedDraft(value.draft),version:value.version};
}
