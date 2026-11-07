# Attività reali

Modulo indipendente SQLite/D1; flag `groupsEnabled` disabilitato per default. Richiede migrazione `0005` (blocchi/sicurezza) prima di `0006_groups.sql`. Non crea utenti, invia messaggi esterni, prenota o addebita costi.

Integrazione: eseguire `GROUPS_SCHEMA` nello store Node; creare `store.groups = createGroupsStore({first,all})`, con adattatori SQL asincroni compatibili D1 e Node. Montare `createGroupRoutes({store,enabled:config.groupsEnabled})` nel dispatcher dopo autenticazione/CSRF. Entrambi gli adattatori devono fornire `first(sql,...args)` e `all(sql,...args)`. Le scritture usano `RETURNING`. `LiveGroups({mine:false})` mostra attività pubbliche, `mine:true` aggiunge creazione e attività proprie. La sessione deve causare il remount del componente quando cambia utente.

| Metodo | Percorso | Corpo / risposta |
|---|---|---|
| GET | `/api/groups` | `{groups:[summary]}`: massimo 50 attività future non annullate |
| GET | `/api/groups?mine=true` | Attività organizzate, partecipazioni approvate, richieste in attesa (include annullate/passate) |
| POST | `/api/groups` | `{title,description,city,category,startsAt,place,publicPlace:true,cost,capacity}` → 201 `{group}` |
| GET | `/api/groups/:id` | `{group}` con dettaglio secondo ruolo |
| POST | `/api/groups/:id/request` | `{note}`: facoltativa come contenuto, obbligatoria come stringa, massimo 500 caratteri |
| POST | `/api/groups/:id/approve` | `{userId}`: solo organizzatore |
| POST | `/api/groups/:id/reject` | `{userId}`: solo organizzatore |
| POST | `/api/groups/:id/leave` | `{}`: solo membro, organizzatore deve annullare |
| POST | `/api/groups/:id/cancel` | `{}`: solo organizzatore |

Le azioni restituiscono `{ok:true}`. Gli errori sono JSON `{error}`: 400 validazione, 401 sessione assente, 403 profilo o ruolo non idoneo, 404 risorsa non visibile, 409 stato cambiato/posti esauriti, 503 funzione spenta. Dati client non possono scegliere organizzatore, membri, stato richiesta o ruolo.

Titolo 1–140, descrizione 1–2000, luogo 1–240, costo 1–140 caratteri; provincia in Emilia-Romagna e categoria del catalogo. `startsAt` richiede ISO con fuso, data valida futura entro 180 giorni. Capienza intera 2–20, incluso organizzatore. La conferma del luogo pubblico è una dichiarazione dell’organizzatore, non una verifica esterna.

Summary: `id,organizerId,title,description,city,category,startsAt,place,cost,capacity,cancelled,created,memberCount,ownRole`. `ownRole` è `organizer|member|pending|visitor`. Dettagli `members:[{userId,name}]` disponibili solo ai partecipanti approvati; `requests:[{userId,name,note,state,created}]` solo organizzatore e soltanto richieste pendenti. Nessuna email viene letta/proiettata nei dati sociali.

Controlli di maggiore età, sospensione, blocchi bilaterali sono ripetuti nel SQL di lettura/scrittura. Un gruppo con organizzatore non idoneo o membro bloccato bilateralmente dal visitatore è nascosto. L’approvazione ricontrolla idoneità e blocchi di tutti i membri e del richiedente; l’inserimento dell’ultimo posto è condizionale atomico. Trigger aggiungono organizzatore e aggiornano stato richiesta nello stesso statement. Uscita e annullamento restano possibili se nel frattempo cambiano idoneità o blocchi. Cancellazione account rimuove gruppi e partecipazioni con cascata. Chat gestita dal modulo community, che ricontrolla appartenenza e sicurezza autonomamente.

Verifica dedicata: `node --test tests/groups.test.mjs`. Nessuna prova con utenti reali, OAuth reale, deploy o dispositivi è implicata dai test SQLite.
