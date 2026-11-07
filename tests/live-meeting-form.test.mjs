import test from 'node:test';
import assert from 'node:assert/strict';
import {appointmentFields,appointmentProposal,versionedAppointment} from '../src/live-meeting-form.mjs';

const now=new Date(2026,10,7,10).getTime();
const form={activity:'  Due passi  ',date:'2026-11-08',time:'15:30',place:'Piazza pubblica',cost:'Gratuito',publicPlace:true};
test('converts separate local date and time to a timezone-qualified instant',()=>{
 const proposal=appointmentProposal(form,now);
 assert.equal(proposal.startsAt,new Date(2026,10,8,15,30).toISOString());
 assert.equal(proposal.activity,'Due passi');
 assert.deepEqual(appointmentFields(proposal),{...form,activity:'Due passi'});
});
test('rejects calendar overflow, invalid format and impossible clock values',()=>{
 for(const change of [{date:'2027-02-29'},{date:'2026-11-31'},{date:'2026-13-01'},{date:'08/11/2026'},{time:'24:00'},{time:'15:60'},{time:'3:30'}])assert.throws(()=>appointmentProposal({...form,...change},now));
});
test('requires a strictly future instant within 180 days',()=>{
 assert.throws(()=>appointmentProposal({...form,date:'2026-11-07',time:'10:00'},now));
 assert.throws(()=>appointmentProposal({...form,date:'2027-05-07'},now));
 assert.doesNotThrow(()=>appointmentProposal({...form,date:'2027-05-06',time:'10:00'},now));
});
test('requires explicit public place and bounded nonempty proposal details',()=>{
 for(const change of [{publicPlace:false},{activity:' '},{activity:'x'.repeat(141)},{place:'x'.repeat(241)},{cost:''}])assert.throws(()=>appointmentProposal({...form,...change},now));
});
test('builds versioned edits without changing the loaded snapshot',()=>{
 const loaded={id:'meeting',version:3,confirmations:['me'],activity:'Old'};
 const changes=appointmentProposal(form,now);
 assert.deepEqual(versionedAppointment(loaded,changes),{version:3,changes});
 assert.deepEqual(versionedAppointment(loaded),{version:3});
 assert.equal(loaded.version,3);assert.deepEqual(loaded.confirmations,['me']);
 for(const version of [0,-1,1.5,undefined,'3'])assert.throws(()=>versionedAppointment({version}));
});
