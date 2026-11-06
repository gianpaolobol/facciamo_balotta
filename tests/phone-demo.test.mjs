import test from 'node:test';import assert from 'node:assert/strict';
import {demoScene} from '../src/demo-routing.mjs';import {ACTIVITIES} from '../src/fixtures.ts';import {resolveCover} from '../src/art-catalog.mjs';
test('preview routes allow only known illustrative scenes',()=>{
 assert.equal(demoScene('registration'),'registration');assert.equal(demoScene('match'),'match');assert.equal(demoScene('appointment'),'appointment');assert.equal(demoScene('live'),null);assert.equal(demoScene('admin'),null);assert.equal(demoScene(undefined),null);
});
test('the poetic climbing proposal carries its explicit activity type',()=>{
 const activity=ACTIVITIES.find(a=>a.id==='climb');assert.equal(resolveCover(activity),'climbing');
});
