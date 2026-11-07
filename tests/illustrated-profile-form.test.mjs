import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {useIllustratedProfileDraft} from '../src/illustrated-profile-form.mjs';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
async function form() {
 let api,tree;
 function Harness(){api=useIllustratedProfileDraft();return null;}
 await act(()=>{tree=create(React.createElement(Harness));});
 return {get api(){return api;},async change(id,text){await act(()=>api.setText(id,text));},async confirm(id){await act(()=>api.confirm(id));},async close(){await act(()=>tree.unmount());}};
}
test('six fields start empty and unconfirmed',async()=>{
 const f=await form();assert.equal(Object.keys(f.api.fields).length,6);assert.ok(Object.values(f.api.fields).every(x=>x===''));assert.equal(f.api.isConfirmed('portrait'),false);await f.close();
});
test('editing one confirmed description resets only that confirmation even after restoring the text',async()=>{
 const f=await form();await f.change('portrait','Capelli corti');await f.confirm('portrait');await f.change('interest-1','Cammino');await f.confirm('interest-1');
 assert.equal(f.api.isConfirmed('portrait'),true);await f.change('portrait','Capelli lunghi');await f.change('portrait','Capelli corti');
 assert.equal(f.api.isConfirmed('portrait'),false);assert.equal(f.api.isConfirmed('interest-1'),true);await f.close();
});
test('blank and duplicate interests cannot be confirmed',async()=>{
 const f=await form();await f.confirm('portrait');assert.ok(f.api.error);assert.equal(f.api.isConfirmed('portrait'),false);
 await f.change('interest-1',' Musica ');await f.confirm('interest-1');await f.change('interest-2','musica');await f.confirm('interest-2');
 assert.ok(f.api.error);assert.equal(f.api.isConfirmed('interest-2'),false);assert.equal(f.api.isConfirmed('interest-1'),true);await f.close();
});
test('all five interests can be confirmed without a portrait',async()=>{
 const f=await form();for(let i=1;i<=5;i++){await f.change(`interest-${i}`,`Interesse ${i}`);await f.confirm(`interest-${i}`);assert.equal(f.api.isConfirmed(`interest-${i}`),true);}
 assert.equal(f.api.isConfirmed('portrait'),false);await f.close();
});
test('removing an interest leaves other slot identities and confirmations intact',async()=>{
 const f=await form();await f.change('interest-1','Musica');await f.confirm('interest-1');await f.change('interest-2','Libri');await f.confirm('interest-2');await f.change('interest-1','');
 assert.equal(f.api.isConfirmed('interest-1'),false);assert.equal(f.api.fields['interest-2'],'Libri');assert.equal(f.api.isConfirmed('interest-2'),true);await f.close();
});
test('unknown slots and overlong descriptions cannot enter the draft',async()=>{
 const f=await form();await f.change('interest-6','Sport');assert.equal(f.api.fields['interest-6'],undefined);assert.ok(f.api.error);
 await f.change('portrait','a'.repeat(1001));assert.equal(f.api.fields.portrait,'');assert.ok(f.api.error);await f.close();
});
test('unmounting discards the draft before mounting another form',async()=>{
 const f=await form();await f.change('portrait','Testo privato');await f.confirm('portrait');await f.close();const next=await form();assert.equal(next.api.fields.portrait,'');assert.equal(next.api.isConfirmed('portrait'),false);await next.close();
});
test('unrelated duplicate interests do not block portrait or distinct interest confirmation',async()=>{
 const f=await form();await f.change('interest-1','Musica');await f.change('interest-2','musica');
 await f.change('portrait','Capelli corti');await f.confirm('portrait');assert.equal(f.api.isConfirmed('portrait'),true);
 await f.change('interest-3','Cammino');await f.confirm('interest-3');assert.equal(f.api.isConfirmed('interest-3'),true);await f.close();
});
test('validation identifies the field responsible for the visible error',async()=>{
 const f=await form();await f.confirm('interest-1');assert.equal(f.api.errorId,'interest-1');assert.ok(f.api.error);
 await f.change('interest-1','Libri');assert.equal(f.api.errorId,null);assert.equal(f.api.error,'');await f.close();
});
