# Appuntamenti a due — API predisposta

Il backend Node/Workers comprende ora un contratto persistente per coppie e appuntamenti. MEETINGS_ENABLED=false è il default. Questo incremento non attiva matching, utenti o inviti reali; non cambia le schermate demo. Il matching per interessi/intenzioni/disponibilità e l’interfaccia multiutente sono collegati nella beta; l’attivazione reale resta da configurare e collaudare.

Applicare tutte le migrazioni, inclusa 0004_meetings.sql. Su Node lo schema viene inizializzato dallo store; su D1 le migrazioni sono esplicite. Nessuna dipendenza o servizio esterno aggiunto.

## Candidati e interesse

Il solo servizio interno può usare store.meetings.offerPair(userA,userB), con due identità distinte. Non esiste un endpoint pubblico per creare una coppia o selezionare utenti arbitrari dal client. La stessa coppia ha un solo record, anche quando l'offerta viene richiesta due volte. Il matching implementato richiede consenso, interessi/intenzione/disponibilità compatibili e la stessa provincia salvo ambito regionale scelto da entrambi. Non usa il ritratto.

GET /api/pairings restituisce fino a50 candidati visibili; GET /api/pairings/:id legge un candidato. Sono visibili soltanto i record in cui l'utente è uno dei due membri e ambedue hanno un profilo con maggiore età dichiarata. La risposta contiene nome visualizzato del peer, ID, scelta propria, indicatore di reciprocità e ID dell'eventuale appuntamento; non email, token, testi privati o scelta altrui separata.

POST /api/pairings/:id/decision riceve solo decision yes/no. Le ripetizioni identiche sono idempotenti. È possibile ritirare un sì: il no nasconde la coppia e un trigger annulla atomicamente l’eventuale appuntamento. Occorrono due sì prima di creare un appuntamento.

## Proposta e conferme

POST /api/pairings/:id/appointment riceve activity (1–140caratteri), startsAt (ISO con timezone nel futuro entro180giorni), place (1–240), cost (1–140) e publicPlace=true. Il luogo è dichiarato pubblico dall'utente: il server non verifica una prenotazione o la disponibilità reale della sede. Ogni coppia può creare un solo appuntamento in questo incremento.

GET /api/appointments e GET /api/appointments/:id restituiscono solo gli appuntamenti dei due membri autorizzati. La risposta contiene versione e conferme. Le date sono restituite in UTC ISO; il futuro client le mostrerà nel fuso dell'utente.

POST /api/appointments/:id/confirm riceve solo version: due sì sulla stessa versione confermano. La conferma è idempotente e non cambia la versione del contenuto. PATCH /api/appointments/:id riceve version e changes con soli campi della proposta: la versione aumenta e tutte le conferme si azzerano. Due revisioni concorrenti sulla stessa versione: una sola riesce. Il server controlla anche che la copia letta abbia la versione attesa prima di unire changes, evitando di ripristinare campi da una copia precedente. Una conferma obsoleta restituisce409; non può confermare un appuntamento nel passato.

POST /api/appointments/:id/cancel riceve version: annulla, aumenta la versione e azzera le conferme. L'annullamento è terminale; non si riapre il record in questo incremento. Gli ID dei membri, lo stato e le conferme non sono modificabili dal body del client.

## Accesso e concorrenza

Sessione obbligatoria, stessi controlli CSRF cookie/bearer del backend. Un estraneo riceve404 su risorse private, anche conoscendo l'ID. Le mutazioni ricontrollano appartenenza, maggiore età dei due membri e reciprocità nella stessa istruzione SQL che scrive: non dipendono soltanto dalla lettura iniziale della route. Eliminare un account cancella con cascata coppie/appuntamenti; nessun dato dell'altro provider viene esposto.

Ogni conferma aggiorna il proprio flag relazionale senza riscrivere la lista dell'altro partecipante. Modifica e annullamento usano versione attesa dentro UPDATE. Se la risorsa cambia durante l'operazione,409 invita a ricaricare. Questa API non effettua pagamenti o prenotazioni. Chat e aggiornamenti interni sono collegati nei rispettivi moduli; nessun push/email esterno viene inviato.

## Prima dell'attivazione

Matching con consenso/preferenze, UI reale separata dalla demo, blocco/segnalazione e moderazione sono implementati e testati localmente. Prima dell’attivazione completare configurazione reale, informative definitive e collaudo con due account e dispositivi reali. Le prove automatiche con utenti sintetici e D1 locale non attestano un servizio online o una build firmata. Lasciare MEETINGS_ENABLED=false fino a questi passaggi e alla distribuzione nell'ambiente autorizzato.

Gli incontri passati restano nello storico e non possono essere spostati nuovamente nel futuro: ciò evita di riattivare una seconda coppia mentre il matching ne propone una nuova. Disattivare la visibilità ritira i candidati non ancora reciproci; le connessioni già reciproche restano accessibili, mentre le illustrazioni condivise vengono nascoste fino a nuovo consenso.
