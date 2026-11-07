import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {useIllustratedProfileDraft} from '../src/illustrated-profile-form.mjs';
import {emptyIllustratedDraft} from '../src/illustrated-draft.mjs';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
async function form(options={}){
 let api,tree;function Harness(){api=useIllustratedProfileDraft(options);return null;}
 await act(async()=>{tree=create(React.createElement(Harness));});
 return {get api(){return api;},async run(fn){await act(fn);},async close(){await act(()=>tree.unmount());}};
}
const saved=(text,version=1)=>{const draft=emptyIllustratedDraft();draft.fields.portrait=text;draft.confirmed.portrait=text;return {draft,version};};
test('saved descriptions and confirmations are restored on opening the form',async()=>{
 const f=await form({loadDraft:async()=>saved('Capelli corti',3)});assert.equal(f.api.fields.portrait,'Capelli corti');assert.equal(f.api.isConfirmed('portrait'),true);assert.equal(f.api.version,3);assert.equal(f.api.dirty,false);assert.equal(f.api.loadState,'ready');await f.close();
});
test('late loading cannot overwrite edits because editing is disabled until load completes',async()=>{
 let finish;const f=await form({loadDraft:()=>new Promise(resolve=>finish=resolve)});
 assert.equal(f.api.loadState,'loading');await f.run(()=>f.api.setText('portrait','Testo prematuro'));assert.equal(f.api.fields.portrait,'');
 await f.run(async()=>finish(saved('Testo salvato')));assert.equal(f.api.fields.portrait,'Testo salvato');await f.close();
});
test('explicit saving sends the current version and editing invalidates its own stored confirmation',async()=>{
 const writes=[];const f=await form({loadDraft:async()=>saved('Prima',2),saveDraft:async body=>{writes.push(body);return {...body,version:3};}});
 await f.run(()=>f.api.setText('portrait','Dopo'));assert.equal(f.api.dirty,true);await f.run(()=>f.api.save());
 assert.equal(writes.length,1);assert.equal(writes[0].version,2);assert.equal(writes[0].draft.fields.portrait,'Dopo');assert.equal(writes[0].draft.confirmed.portrait,undefined);assert.equal(f.api.version,3);assert.equal(f.api.dirty,false);await f.close();
});
test('load failures prevent overwriting a saved draft and can be retried',async()=>{
 let fails=true,writes=0;const f=await form({loadDraft:async()=>{if(fails)throw Error('Connessione assente');return saved('Recuperata');},saveDraft:async()=>{writes++;}});
 assert.equal(f.api.loadState,'error');await f.run(()=>f.api.setText('portrait','Non sovrascrivere'));await f.run(()=>f.api.save());assert.equal(writes,0);assert.equal(f.api.fields.portrait,'');
 fails=false;await f.run(()=>f.api.reload());assert.equal(f.api.fields.portrait,'Recuperata');assert.equal(f.api.loadState,'ready');await f.close();
});
test('save failures preserve local edits and confirmations for another attempt',async()=>{
 let fails=true;const f=await form({loadDraft:async()=>saved('Prima'),saveDraft:async body=>{if(fails)throw Error('Ricarica la bozza');return {...body,version:2};}});
 await f.run(()=>f.api.setText('portrait','Dopo'));await f.run(()=>f.api.confirm('portrait'));await f.run(()=>f.api.save());assert.equal(f.api.fields.portrait,'Dopo');assert.equal(f.api.isConfirmed('portrait'),true);assert.equal(f.api.dirty,true);assert.equal(f.api.version,1);assert.equal(f.api.syncError,'Ricarica la bozza');
 fails=false;await f.run(()=>f.api.save());assert.equal(f.api.version,2);assert.equal(f.api.dirty,false);await f.close();
});
test('demo mode never attempts loading or saving',async()=>{
 const f=await form();await f.run(()=>f.api.setText('portrait','Esempio inventato'));await f.run(()=>f.api.save());assert.equal(f.api.loadState,'ready');assert.equal(f.api.version,0);assert.equal(f.api.dirty,true);await f.close();
});
test('edits and double clicks are ignored while a save is running',async()=>{
 let finish,writes=0;const f=await form({loadDraft:async()=>saved('Prima'),saveDraft:body=>{writes++;return new Promise(resolve=>finish=()=>resolve({...body,version:2}));}});
 await f.run(()=>f.api.setText('portrait','Dopo'));let pending;
 await f.run(()=>{pending=f.api.save();f.api.save();});assert.equal(writes,1);assert.equal(f.api.saving,true);
 await f.run(()=>f.api.setText('portrait','Durante'));assert.equal(f.api.fields.portrait,'Dopo');
 await f.run(async()=>{finish();await pending;});assert.equal(f.api.saving,false);assert.equal(f.api.dirty,false);await f.close();
});
test('invalid confirmed snapshots fail loading rather than showing two equivalent confirmed interests',async()=>{
 const value=saved('Ritratto');value.draft.fields['interest-1']='Musica';value.draft.fields['interest-2']='Ｍｕｓｉｃａ';value.draft.confirmed['interest-1']='Musica';value.draft.confirmed['interest-2']='Ｍｕｓｉｃａ';
 const f=await form({loadDraft:async()=>value});assert.equal(f.api.loadState,'error');assert.equal(f.api.isConfirmed('interest-1'),false);await f.close();
});
test('a delayed load for a previous account cannot populate the next account draft',async()=>{
 const {ProfileScope}=await import('../src/profile-scope.mjs');let api,tree,finish;
 const loadA=()=>new Promise(resolve=>finish=resolve),loadB=async()=>saved('Profilo B',2);
 function Form({loadDraft}){api=useIllustratedProfileDraft({loadDraft});return null;}
 const view=(userId,loadDraft)=>React.createElement(ProfileScope,{mode:'live',userId},React.createElement(Form,{loadDraft}));
 await act(async()=>{tree=create(view('a',loadA));});await act(async()=>tree.update(view('b',loadB)));
 assert.equal(api.fields.portrait,'Profilo B');await act(async()=>finish(saved('Privato A',5)));assert.equal(api.fields.portrait,'Profilo B');assert.equal(api.version,2);await act(()=>tree.unmount());
});
test('a delayed save from an unmounted account does not clear the next account edits',async()=>{
 const {ProfileScope}=await import('../src/profile-scope.mjs');let api,tree,finish;
 const loadA=async()=>saved('Profilo A'),loadB=async()=>saved('Profilo B',2),saveA=body=>new Promise(resolve=>finish=()=>resolve({...body,version:9}));
 function Form({loadDraft,saveDraft}){api=useIllustratedProfileDraft({loadDraft,saveDraft});return null;}
 const view=(userId,loadDraft,saveDraft)=>React.createElement(ProfileScope,{mode:'live',userId},React.createElement(Form,{loadDraft,saveDraft}));
 await act(async()=>{tree=create(view('a',loadA,saveA));});await act(()=>api.setText('portrait','Modificato A'));let pending;await act(()=>{pending=api.save();});
 await act(async()=>tree.update(view('b',loadB)));await act(()=>api.setText('portrait','Modificato B'));await act(async()=>{finish();await pending;});
 assert.equal(api.fields.portrait,'Modificato B');assert.equal(api.dirty,true);assert.equal(api.version,2);await act(()=>tree.unmount());
});
