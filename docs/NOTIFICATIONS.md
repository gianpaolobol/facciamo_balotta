# Aggiornamenti persistenti nell’app

Casella personale di aggiornamenti generici, generati atomicamente dalle scritture SQLite/D1. Nessun testo del messaggio, nota di partecipazione, nome, email o token dispositivo viene salvato nella notifica. Non vengono inviati push, email o richieste a servizi esterni.

## Integrazione

Applicare `0009_notifications.sql` dopo le migrazioni delle coppie, dei gruppi e della community. In Node eseguire `NOTIFICATIONS_SCHEMA` dopo tutti gli altri schemi. Collegare `store.notifications = createNotificationsStore({first,all})` usando gli adattatori SQL asincroni già usati da Node/D1. Montare `createNotificationRoutes({store,enabled:config.notificationsEnabled})` nel dispatcher autenticato dopo il controllo di origine/CSRF. Il flag resta disattivato per default.

Montare `NotificationInbox()` solo con sessione e funzione disponibili; assegnare una chiave dipendente dall’account o smontarlo al cambio sessione. Il componente scarta risposte dopo lo smontaggio, svuota i risultati durante l’aggiornamento e non conserva dati dopo errori. Non effettua polling in background e non richiede permessi del dispositivo.

## Contratto

| Metodo | Percorso | Risultato |
|---|---|---|
| GET | `/api/notifications` | `{notifications:[{id,kind,pairId?,groupId?,created,read}],unread}` |
| POST | `/api/notifications/:id/read` | Corpo `{}`; risposta `{ok:true}` |
| POST | `/api/notifications/read-all` | Corpo `{}`; segna tutti i propri aggiornamenti attualmente visibili come letti, risposta `{ok:true}` |

`id` è un intero positivo; `created` è un timestamp Unix in millisecondi e `read` è booleano. Un solo riferimento (`pairId` o `groupId`) è presente. La risposta contiene al massimo i 50 aggiornamenti visibili più recenti, ordinati per ID decrescente. `unread` conta tutti gli aggiornamenti visibili non letti conservati, fino a 100, anche se oltre i 50 mostrati. Il contrassegno letto è idempotente e limitato ai propri aggiornamenti attualmente visibili. Un aggiornamento altrui o non più visibile restituisce 404 e non viene modificato.

Errori JSON `{error}`: 400 corpo non valido; 401 sessione assente; 403 profilo non maggiorenne o sospeso; 404 notifica non disponibile; 405 metodo non previsto; 503 funzione disattivata. Le route non accettano riferimenti o destinatari dal client.

“Segna tutti come letti” comprende anche le righe visibili precedenti ai 50 aggiornamenti mostrati. La scrittura è atomica e idempotente, ricontrolla idoneità e autorizzazioni nel SQL e non modifica righe altrui o attualmente nascoste. Non restituisce ID, conteggi o riferimenti delle righe nascoste. La casella ricarica elenco e conteggio dopo l’azione.

## Eventi

| Evento persistente | Destinatari | Tipo |
|---|---|---|
| Inserimento coppia | Entrambe le persone | `pair` |
| Nuovo messaggio a due | L’altra persona | `message` |
| Nuovo messaggio di gruppo | Membri approvati, escluso mittente | `message` |
| Nuova richiesta pendente, anche ripresentata dopo rifiuto | Organizzatore | `request` |
| Inserimento partecipazione approvata | Membro aggiunto, escluso organizzatore | `approval` |

Trigger `AFTER INSERT` generano gli aggiornamenti nella stessa operazione dell’evento. Un trigger `AFTER UPDATE OF state` copre la ripresentazione delle richieste. Aggiornamenti idempotenti di messaggi esistenti non creano duplicati. Un trigger elimina le righe più vecchie oltre 100 per destinatario; tale limite comprende anche notifiche nascoste dalle condizioni correnti. Gli eventi precedenti alla migrazione non vengono recuperati retroattivamente. I trigger non dipendono dal flag dell’API: anche con casella disattivata mantengono soltanto la coda limitata.

## Visibilità e cancellazione

Ogni elenco e ogni scrittura di lettura verifica di nuovo nel SQL maggiore età dichiarata, sospensione, appartenenza e blocchi bilaterali. Le coppie rifiutate o bloccate sono nascoste; i loro messaggi richiedono interesse reciproco corrente. I gruppi annullati sono nascosti; chi lascia perde gli aggiornamenti di messaggio e approvazione. Le approvazioni non sono mostrate all’organizzatore; le richieste sono mostrate solo all’organizzatore mentre esiste almeno una richiesta pendente idonea. L’organizzatore e tutti i membri devono essere idonei e non avere blocchi bilaterali con il destinatario. L’eliminazione dell’account, della coppia o del gruppo rimuove le rispettive notifiche con cascata.

I contenuti della notifica sono generici: una richiesta non identifica quale persona l’abbia inviata. Se una richiesta viene decisa e altre sono ancora pendenti, l’aggiornamento generico può restare visibile. Per leggere contenuti e persone servono le API del dominio con le loro autorizzazioni correnti.

## Verifica e lavoro esterno

`node --test tests/notifications.test.mjs` verifica trigger, destinatari, revoche, privacy, contrassegno letto e limiti con SQLite in memoria. Non costituisce una prova su telefoni o infrastruttura pubblicata.

APNs e FCM non sono configurati. Restano esterni a questo modulo credenziali e ambienti push, registrazione/revoca token, consenso del dispositivo, build firmate, associazione delle credenziali ai bundle e prove reali iOS/Android. Il nome “aggiornamenti nell’app” non implica consegna in background o a app chiusa.
