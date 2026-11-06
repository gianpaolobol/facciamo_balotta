/** Immutable rules shared by web, iOS, Android and API tests. */
export function confirmDate(proposal, userId, version) {
 if (!proposal.members.includes(userId)) throw new Error('Utente non autorizzato.');
 if (proposal.version !== version) throw new Error('La proposta è stata aggiornata: conferma la nuova versione.');
 const confirmations=[...new Set([...proposal.confirmations,userId])];
 return {...proposal, confirmations, status:proposal.members.every(id=>confirmations.includes(id))?'confirmed':'proposed'};
}
export function reviseDate(proposal, changes) {
 const allowed=new Set(['activity','startsAt','place','cost']);
 if (!Object.keys(changes).length || Object.keys(changes).some(key=>!allowed.has(key))) throw new Error('Questa modifica non è consentita.');
 return {...proposal,...changes,version:proposal.version+1,confirmations:[],status:'proposed'};
}
export function approveRequest(activity, actorId, applicantId) {
 if (actorId!==activity.organizerId) throw new Error('Solo l’organizzatore può approvare.');
 if (activity.members.includes(applicantId)) throw new Error('Partecipante già presente.');
 if (!activity.requests.includes(applicantId)) throw new Error('Nessuna richiesta di partecipazione.');
 if (activity.members.length>=activity.capacity) throw new Error('La balotta è completa.');
 return {...activity,members:[...activity.members,applicantId],requests:activity.requests.filter(id=>id!==applicantId)};
}
export function matchReasons(a,b) {
 return [...new Set(a.interests)].filter(interest=>b.interests.includes(interest));
}
