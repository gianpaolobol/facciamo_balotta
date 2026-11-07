# Chat e sicurezza della beta

Implementazione locale condivisa SQLite/D1, disabilitata fino a configurazione e collaudo. Nessun invio esterno, email/push o provider a pagamento. Le prove sintetiche non sostituiscono prove con due account/dispositivi reali.

## Integrazione

Applicare tutte le migrazioni in ordine, incluse `0005_community.sql`, `0006_groups.sql` e `0008_moderation_queue.sql`, prima di servire le API. `COMMUNITY_SCHEMA` comprende già il campo `reports.resolved` per nuovi database Node; 0008 aggiunge il campo ai database D1 creati dalle migrazioni precedenti. Creare `store.community=createCommunityStore({first,all})`; i due adapter accettano SQL e parametri posizionali, restituiscono rispettivamente una riga/null e un array. Configurare `createCommunityRoutes({store,enabled,moderatorEmails})` dopo autenticazione e parsing JSON limitato; route non appartenenti al modulo restituiscono null. `store.getProfile(id)` deve restituire il profilo deserializzato.

`moderatorEmails` è un array o stringa con email separate da virgole. `user.email` deve provenire esclusivamente dall'identità server con email verificata dal provider. Nessun ruolo o email nel payload conferisce autorizzazioni. Il controllo sospensione comune deve usare `store.community.isSuspended(userId)` per tutte le API sociali. Cancellazione/logout restano accessibili. I controlli SQL di matching/appuntamenti/gruppi devono applicare `user_blocks` in entrambe le direzioni e `user_safety.suspended=1`, oltre ai controlli di questo modulo.

Montare tutti i pannelli client sotto un componente con key dell'account autenticato. `ChatPanel({kind:'pair'|'group',id})` azzera dati e invalida risposte precedenti al cambio del thread. `SafetyActions({userId?,groupId?,messageId?,onBlocked?})`, `SecurityPanel()` e `ModerationPanel()` gestiscono azioni/errori; moderazione sempre verificata server. Le chat si aggiornano manualmente, senza simulare messaggi o notifiche.

## Contratto

| Metodo e percorso | Richiesta | Risposta |
| --- | --- | --- |
| GET `/api/chat/pair/:id` | — | `{messages:[{id,senderId,body,created}]}` |
| GET `/api/chat/group/:id` | — | Ultimi50 in ordine cronologico, stesso formato |
| POST uno dei due percorsi chat | `{id:UUID,body:string}` | 201 `{message:{id,senderId,body,created}}` |
| GET `/api/blocks` | — | `{blocks:[{userId,name}]}` soltanto propri, max50 |
| POST `/api/blocks` | `{userId:UUID}` | `{ok:true}` |
| DELETE `/api/blocks/:userId` | — | `{ok:true}`, idempotente |
| POST `/api/reports` | Uno di `userId`, `groupId`, `messageId`, con `reason` | 201 `{ok:true}` |
| GET `/api/moderation/reports` | — | `{reports:[...]}` prime50 non risolte, dalle più vecchie, riferimenti/motivo/contesto messaggio ove esistente |
| POST `/api/moderation/reports/:id/resolve` | `{resolved:boolean}` | `{ok:true}`, solo moderatori; false riapre una segnalazione nota |
| POST `/api/moderation/users/:id/suspend` | `{suspended:boolean}` | `{ok:true}` |

`created` usa millisecondi Unix. Testo messaggi e motivi da1 a1000caratteri; stringhe vuote/spazi rifiutati. Il testo viene mostrato come testo, senza eseguire link o HTML. Bloccare richiede UUID di un utente esistente diverso da sé; non esiste ricerca per email. Segnalare un utente richiede un contatto già presente in coppia o gruppo condiviso; un gruppo richiede la stessa visibilità pubblica di `groups.get` (anche visitatori/richiedenti in attesa), maggiore età e organizzatore attivo, nessun blocco con organizzatore/membri; un messaggio richiede accesso corrente alla chat. Nessuna email nelle risposte sociali.

La chat di coppia richiede entrambe le decisioni yes, due maggiorenni attivi e nessun blocco bilaterale. Gruppi: membro approvato, gruppo non annullato, maggiorenne attivo e nessun blocco con qualsiasi membro approvato. Richieste pendenti non danno accesso. Bloccare impedisce immediatamente le letture e scritture successive in entrambe le direzioni. Sbloccare non ripristina decisioni o appartenenze eventualmente rimosse da altri flussi.

Invio e autorizzazione si svolgono nella medesima istruzione SQL: massimo20nuovi messaggi per mittente in una finestra mobile di60secondi, massimo5000messaggi conservati globalmente. Duplicati sono accettati soltanto se ID, mittente, thread e testo coincidono, senza consumare quota e sempre ricontrollando accesso corrente. Client conserva lo stesso ID durante retry di un testo invariato. ID riutilizzato con altri dati, quota esaurita o autorizzazione cambiata durante la richiesta restituiscono409 con errore esplicito; contenuto non accessibile inizialmente404. Nessuna promessa di invio dopo un errore di rete.

Account eliminati rimuovono messaggi inviati, blocchi e proprie segnalazioni mediante FK cascade. I riferimenti a contenuti eliminati nelle segnalazioni altrui diventano null. Le sospensioni impediscono servizi sociali; l'elenco propri blocchi e lo sblocco restano accessibili come controlli di sicurezza. Stato sospensione modificabile esclusivamente via allowlist server.

## Verifica

`node --test tests/community.test.mjs` copre isolamento, richieste pendenti, decisioni non reciproche, contenuti testuali, idempotenza esatta, blocchi bilaterali, cambio autorizzazione tra lettura/scrittura, maggiore età/sospensione, quota/rate concorrenti, ultimi50, segnalazioni/moderazione e cancellazione a cascata. Node SQLite non prova da solo il deployment D1 o le sessioni OAuth reali.

## Quote segnalazioni e coda

Massimo5 nuove segnalazioni per utente per giorno UTC e5000 segnalazioni conservate globalmente, risolte incluse. Target e motivo normalizzato con trim identici dallo stesso autore sono idempotenti: ritornano201 senza nuova riga né consumo quota, anche dopo esaurimento quota. Non riaprono automaticamente una segnalazione risolta. Autorizzazione, deduplicazione e quota si ricontrollano nell'INSERT atomico. I target non visibili restituiscono404;429 si restituisce solo dopo verifica della visibilità e mancato inserimento per quota. Non viene rivelata l'esistenza di target inaccessibili.

La coda mostra prima le più vecchie non risolte (`resolved=0`), massimo50. Il comando risolvi le rimuove dalla coda senza cancellare evidenza o liberare quota. Tutte diventano raggiungibili risolvendo progressivamente quelle precedenti. Il client offre un pulsante per ciascuna segnalazione; il server consente anche `resolved:false` per riaprire tramite ID noto. Solo email verificate incluse nell'allowlist server possono leggere o risolvere segnalazioni.
