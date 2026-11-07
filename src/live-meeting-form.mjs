const DAY=86400000;
const pad=value=>String(value).padStart(2,'0');

export function appointmentFields(appointment){
 const date=new Date(appointment.startsAt);
 if(!Number.isFinite(date.getTime()))throw new Error('La data dell’incontro non è valida. Ricarica la proposta.');
 return {activity:appointment.activity,date:`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`,time:`${pad(date.getHours())}:${pad(date.getMinutes())}`,place:appointment.place,cost:appointment.cost,publicPlace:appointment.publicPlace===true};
}

export function appointmentProposal(form,now=Date.now()){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(form.date)||!/^\d{2}:\d{2}$/.test(form.time))throw new Error('Inserisci la data come AAAA-MM-GG e l’ora come HH:MM.');
 const [year,month,day]=form.date.split('-').map(Number),[hour,minute]=form.time.split(':').map(Number);
 const date=new Date(year,month-1,day,hour,minute,0,0);
 if(year<1000||date.getFullYear()!==year||date.getMonth()!==month-1||date.getDate()!==day||date.getHours()!==hour||date.getMinutes()!==minute)throw new Error('Controlla giorno e ora: questa data non esiste nel tuo fuso orario.');
 if(date.getTime()<=now||date.getTime()>now+180*DAY)throw new Error('Scegli una data futura entro 180 giorni.');
 const result={};
 for(const [key,max,label] of [['activity',140,'L’attività'],['place',240,'Il luogo'],['cost',140,'Il costo']]){
  const value=typeof form[key]==='string'?form[key].trim():'';
  if(!value||value.length>max)throw new Error(`${label} deve contenere da 1 a ${max} caratteri.`);
  result[key]=value;
 }
 if(form.publicPlace!==true)throw new Error('Conferma che l’incontro si svolgerà in un luogo pubblico.');
 return {...result,startsAt:date.toISOString(),publicPlace:true};
}

export function versionedAppointment(appointment,changes){
 if(!Number.isSafeInteger(appointment?.version)||appointment.version<1)throw new Error('Ricarica la proposta prima di continuare.');
 return changes===undefined?{version:appointment.version}:{version:appointment.version,changes};
}
