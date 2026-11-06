import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmDate, reviseDate, approveRequest, matchReasons } from '../src/domain.mjs';

const date = () => ({ id:'date-1', version:1, members:['a','b'], confirmations:[], status:'proposed', activity:'Mostra', startsAt:'2026-11-21T16:00:00+01:00' });
test('an appointment needs both members to confirm the same version', () => {
 const a=confirmDate(date(),'a',1); assert.equal(a.status,'proposed');
 const b=confirmDate(a,'b',1); assert.equal(b.status,'confirmed'); assert.deepEqual(b.confirmations,['a','b']);
});
test('changing an appointment invalidates all earlier confirmations', () => {
 const a=confirmDate(date(),'a',1); const revised=reviseDate(a,{startsAt:'2026-11-22T16:00:00+01:00'});
 assert.equal(revised.version,2); assert.deepEqual(revised.confirmations,[]); assert.equal(revised.status,'proposed');
 assert.throws(()=>confirmDate(revised,'b',1),/aggiornata/);
});
test('outsiders cannot confirm an appointment and membership cannot be changed by a revision', () => {
 assert.throws(()=>confirmDate(date(),'stranger',1),/autorizzato/);
 assert.throws(()=>reviseDate(date(),{members:['a','stranger']}),/modifica/);
});
test('an organizer alone can approve a pending request and may not overfill the last seat', () => {
 const group={organizerId:'o', capacity:2, members:['o'], requests:['a','b']};
 assert.throws(()=>approveRequest(group,'a','b'),/organizzatore/);
 const full=approveRequest(group,'o','a'); assert.deepEqual(full.members,['o','a']); assert.deepEqual(full.requests,['b']);
 assert.throws(()=>approveRequest(full,'o','b'),/completa/); assert.deepEqual(group.members,['o']);
});
test('duplicate and unrequested group approvals do not create extra members', () => {
 const group={organizerId:'o',capacity:6,members:['o','a'],requests:['b']};
 assert.throws(()=>approveRequest(group,'o','a'),/già/); assert.throws(()=>approveRequest(group,'o','c'),/richiesta/);
});
test('matching explanations contain only explicit shared interests', () => {
 assert.deepEqual(matchReasons({interests:['Musica','Arrampicata']},{interests:['Arrampicata','Lettura']}),['Arrampicata']);
 assert.deepEqual(matchReasons({interests:[]},{interests:['Musica']}),[]);
});
