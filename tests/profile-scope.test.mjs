import test from 'node:test';
import assert from 'node:assert/strict';
import React,{useState} from 'react';
import {create,act} from 'react-test-renderer';
import {ProfileScope} from '../src/profile-scope.mjs';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function Form({initial}) {const [value]=useState(initial);return React.createElement('profile',{value});}
test('entering demo discards the mounted private profile fields',async()=>{
 let tree;await act(()=>{tree=create(React.createElement(ProfileScope,{mode:'live',userId:'a'},React.createElement(Form,{initial:'private Parma'})));});
 assert.equal(tree.root.findByType('profile').props.value,'private Parma');
 await act(()=>tree.update(React.createElement(ProfileScope,{mode:'demo',userId:'a'},React.createElement(Form,{initial:'demo Bologna'}))));
 assert.equal(tree.root.findByType('profile').props.value,'demo Bologna');await act(()=>tree.unmount());
});
test('switching native accounts does not retain the previous account form',async()=>{
 let tree;await act(()=>{tree=create(React.createElement(ProfileScope,{mode:'live',userId:'a'},React.createElement(Form,{initial:'Alice private'})));});
 await act(()=>tree.update(React.createElement(ProfileScope,{mode:'live',userId:'b'},React.createElement(Form,{initial:'Bob empty'}))));
 assert.equal(tree.root.findByType('profile').props.value,'Bob empty');await act(()=>tree.unmount());
});
