# Appuntamenti a due — API predisposta

Il backend Node/Workers comprende ora un contratto persistente per coppie e appuntamenti. MEETINGS_ENABLED=false è il default. Questo incremento non attiva matching, utenti o inviti reali; non cambia le schermate demo. Il generatore di candidati e l'interfaccia multiutente restano da collegare.

Applicare tutte le migrazioni, inclusa 0004_meetings.sql. Su Node lo schema viene inizializzato dallo store; su D1 le migrazioni sono esplicite. Nessuna dipendenza o servizio esterno aggiunto.

## Candidati e interesse

Il solo servizio interno può usare store.meetings.offerPair(userA,userB), con due identità distinte. Non esiste un endpoint pubblico per creare una coppia o selezionare utenti arbitrari dal client. La stessa coppia ha un solo record, anche quando l'offerta viene richiesta due volte. Creare candidati in futuro richiederà il matching approvato per interessi/intenzioni/disponibilità, senza analisi estetica del ritratto.

GET /api/pairings restituisce fino a50 candidati visibili; GET /api/pairings/:id legge un candidato. Sono visibili soltanto i record in cui l'utente è uno dei due membri e ambedue hanno un profilo con maggiore età dichiarata. La risposta contiene nome visualizzato del peer, ID, scelta propria, indicatore di reciprocità e ID dell'eventuale appuntamento; non email, token, testi privati o scelta altrui separata.

POST /api/pairings/:id/decision riceve solo decision yes/no. La prima scelta è monouso, un sì ripetuto è idempotente; non si può invertire una scelta già espressa in questo incremento. Una rinuncia nasconde la coppia. Limite attuale: ripetere lo stesso no dopo una risposta persa restituisce404, perché la risorsa è già nascosta; la rinuncia rimane salvata. Rendere trasparente questo retry prima della UI multiutente. Occorrono due sì prima di creare un appuntamento.

## Proposta e conferme

POST /api/pairings/:id/appointment riceve activity (1–140caratteri), startsAt (ISO con timezone nel futuro entro180giorni), place (1–240), cost (1–140) e publicPlace=true. Il luogo è dichiarato pubblico dall'utente: il server non verifica una prenotazione o la disponibilità reale della sede. Ogni coppia può creare un solo appuntamento in questo incremento.

GET /api/appointments e GET /api/appointments/:id restituiscono solo gli appuntamenti dei due membri autorizzati. La risposta contiene versione e conferme. Le date sono restituite in UTC ISO; il futuro client le mostrerà nel fuso dell'utente.

POST /api/appointments/:id/confirm riceve solo version: due sì sulla stessa versione confermano. La conferma è idempotente e non cambia la versione del contenuto. PATCH /api/appointments/:id riceve version e changes con soli campi della proposta: la versione aumenta e tutte le conferme si azzerano. Due revisioni concorrenti sulla stessa versione: una sola riesce. Il server controlla anche che la copia letta abbia la versione attesa prima di unire changes, evitando di ripristinare campi da una copia precedente. Una conferma obsoleta restituisce409; non può confermare un appuntamento nel passato.

POST /api/appointments/:id/cancel riceve version: annulla, aumenta la versione e azzera le conferme. L'annullamento è terminale; non si riapre il record in questo incremento. Gli ID dei membri, lo stato e le conferme non sono modificabili dal body del client.

## Accesso e concorrenza

Sessione obbligatoria, stessi controlli CSRF cookie/bearer del backend. Un estraneo riceve404 su risorse private, anche conoscendo l'ID. Le mutazioni ricontrollano appartenenza, maggiore età dei due membri e reciprocità nella stessa istruzione SQL che scrive: non dipendono soltanto dalla lettura iniziale della route. Eliminare un account cancella con cascata coppie/appuntamenti; nessun dato dell'altro provider viene esposto.

Ogni conferma aggiorna il proprio flag relazionale senza riscrivere la lista dell'altro partecipante. Modifica e annullamento usano versione attesa dentro UPDATE. Se la risorsa cambia durante l'operazione,409 invita a ricaricare. Questa API non effettua pagamenti, prenotazioni, invii messaggi, geolocalizzazione o notifiche.

## Prima dell'attivazione

Completare matching con consenso/preferenze, UI reale separata dalla demo, blocco/segnalazione e moderazione, collaudo con due account e dispositivi reali. Le prove automatiche con utenti sintetici e D1 locale non attestano un servizio online o una build firmata. Lasciare MEETINGS_ENABLED=false fino a questi passaggi e alla distribuzione nell'ambiente autorizzato.
