// Draft descriptions only. Confirmation approves text, not an AI-generated image.
function description(value) {
 if(typeof value!=='string'||!value.trim()) throw new TypeError('Inserisci una descrizione.');
 return value.trim();
}
function slot(id,text) {return {id,description:description(text),revision:1,confirmed:false};}
export function createIllustratedProfile({portrait='',interests=[]}={}) {
 if(typeof portrait!=='string') throw new TypeError('Descrizione del ritratto non valida.');
 if(!Array.isArray(interests)||interests.length>5) throw new TypeError('Scegli al massimo cinque interessi.');
 const slots=interests.map((text,index)=>slot(`interest-${index+1}`,text));
 const normalized=slots.map(x=>x.description.normalize('NFKC').toLocaleLowerCase('it-IT'));
 if(new Set(normalized).size!==slots.length) throw new TypeError('Descrivi interessi distinti.');
 return {portrait:portrait.trim()?slot('portrait',portrait):null,interests:slots};
}
function updateSlot(profile,id,update) {
 const found=(profile.portrait?.id===id)||profile.interests.some(x=>x.id===id);
 if(!found) throw new RangeError('Illustrazione non presente nel profilo.');
 return { ...profile,portrait:profile.portrait?.id===id?update(profile.portrait):profile.portrait,
 interests:profile.interests.map(x=>x.id===id?update(x):x)};
}
export function editIllustration(profile,id,text) {
 const next=description(text);
 // Reapply distinct-interest validation before accepting an edit.
 if(id!=='portrait') createIllustratedProfile({interests:profile.interests.map(x=>x.id===id?next:x.description)});
 return updateSlot(profile,id,x=>next===x.description?x:{...x,description:next,revision:x.revision+1,confirmed:false});
}
export function confirmIllustration(profile,id) {
 return updateSlot(profile,id,x=>({...x,confirmed:true}));
}
