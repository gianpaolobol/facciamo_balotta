import test from 'node:test';
import assert from 'node:assert/strict';
import {createIllustratedProfile,editIllustration,confirmIllustration} from '../src/illustrated-profile.mjs';
test('allows an omitted portrait and five distinct interests',()=>{
 const p=createIllustratedProfile({interests:['Cammino','Musica','Cucina','Cinema','Libri']});
 assert.equal(p.portrait,null);assert.equal(p.interests.length,5);
 assert.ok(p.interests.every(x=>!x.confirmed));
});
test('rejects a sixth interest and duplicate descriptions',()=>{
 assert.throws(()=>createIllustratedProfile({interests:['a','b','c','d','e','f']}));
 assert.throws(()=>createIllustratedProfile({interests:[' Musica ','musica']}));
});
test('rejects malformed and blank descriptions',()=>{
 for(const interests of [null,'musica',[null],[' '],[42]]) assert.throws(()=>createIllustratedProfile({interests}));
 assert.throws(()=>createIllustratedProfile({portrait:42}));
});
test('an edit invalidates only its own confirmation and keeps the input immutable',()=>{
 let p=createIllustratedProfile({portrait:'Capelli corti',interests:['Cammino','Musica']});
 p=confirmIllustration(confirmIllustration(p,'portrait'),'interest-1');
 const edited=editIllustration(p,'portrait','Capelli lunghi');
 assert.equal(edited.portrait.confirmed,false);assert.equal(edited.portrait.revision,2);
 assert.equal(edited.interests[0].confirmed,true);assert.equal(p.portrait.description,'Capelli corti');
});
test('unknown slots cannot be confirmed or edited',()=>{
 const p=createIllustratedProfile();
 assert.throws(()=>confirmIllustration(p,'portrait'));
 assert.throws(()=>editIllustration(p,'interest-9','Musica'));
});
