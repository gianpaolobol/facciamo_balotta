# Inviti anonimi ai contatti scelti

Pannello in Profilo per web/iOS/Android: aggiunta manuale email o telefoni internazionali, selezione multipla, seleziona/deseleziona tutti, anteprima e `Invita tutti i selezionati (N)`. La nota in12px compare sotto la selezione e prima della conferma: «L’invito non mostra la tua identità o il tuo profilo agli invitati.» Il contatto non selezionato e il nome locale non sono trasmessi. La rubrica non viene letta automaticamente. Il pannello resta facoltativo.

La demo usa soltanto tre destinatari fittizi, non accetta contatti reali e simula esplicitamente. Il profilo live mantiene bozza e selezione solo in memoria, con isolamento per account e scarto delle risposte obsolete. Contatti duplicati vengono normalizzati/deduplicati; numeri senza prefisso internazionale non validi. Massimo20 destinatari per invio.

## Stato operativo

`INVITATIONS_ENABLED=false`; nessun fornitore collegato e nessun invito reale inviato. Il pulsante live non può spedire finché non è configurato un canale ufficiale anonimo e gratuito. L'anteprima precedente pubblicata non viene aggiornata dal solo salvataggio di questa PR.

Non sono usati SMS, WhatsApp, email o account personali per spedire: esporrebbero il mittente. L'anonimato richiesto riguarda identità/profilo dell'invitante verso i destinatari; il fornitore deve necessariamente trattare il recapito di destinazione. Non è una promessa di anonimato assoluto.

## API e adattatore

POST `/api/invitations`, sessione idonea maggiorenne e origine autorizzata/bearer nativo. Corpo `{batchId,recipients:[{channel:'email'|'phone',address}],anonymityAcknowledged:true}`. Risposta privata `{results:[{channel,address,status:'accepted'|'failed'|'unknown'}]}`. `accepted` significa accettazione del servizio, senza garanzia di consegna o lettura; `unknown` conserva l'incertezza di timeout/eccezioni/risposte non conclusive.

Tutti i destinatari sono validati e prenotati prima del primo invio; i canali non supportati respingono l'intera richiesta. Invii singoli: nessun invitato vede gli altri recapiti. Testo fisso condiviso con l'anteprima, link pubblico senza identificatori/referral, nessun nome/numero/alias/profilo dell'invitante. Retry dello stesso batch non ripete gli invii; un payload diverso con stesso batch restituisce409. Durante un invio già avviato la cancellazione dell'account non può annullare la consegna del fornitore; impedisce i destinatari successivi tramite ricontrollo di sessione e idoneità.

`createApp({invitationProvider})` accetta un adattatore esclusivamente server con `freePlanConfirmed:true`, `anonymousSender:true`, `channels` espliciti e `send({channel,address,message,link,idempotencyKey,signal})`. Solo `{accepted:true}` attesta accettazione; `{accepted:false}` rifiuto certo. La sua integrazione reale, verifica del mittente ufficiale e rispetto del piano gratuito restano da eseguire in un ambiente autorizzato. Non esiste fallback personale o a pagamento. I punti di avvio Node/Worker non istanziano alcun adattatore.

Configurazione: `INVITATIONS_ENABLED`, `INVITATION_URL` HTTPS pubblico reale senza query/credenziali/fragment, `INVITATION_HASH_KEY64HEX` server-only. Nessun segreto in `EXPO_PUBLIC_`. Presenza flag/chiave senza adattatore mantiene `features.invitations=false`, canali vuoti e API503. La config pubblica fornisce soltanto disponibilità, canali e limite20.

## Persistenza e limiti

Applicare `0011_invitations.sql` dopo le migrazioni esistenti. Node applica `INVITATIONS_SCHEMA`. Un solo statement SQLite/D1 prenota l'intero batch con limiti20/account e50globali/giorno UTC, compresi errori. Ledger HMAC dei destinatari e dell'identità provider, nessun recapito o nome in chiaro persistito. Eliminare e ricreare l'account non azzera il limite della giornata.

La finestra operativa del ledger è7giorni: le righe scadute sono eliminate alla successiva prenotazione. Senza nuove prenotazioni, o a funzione spenta, la pulizia è differita; non esiste un processo periodico nel repository. Prima dell'attivazione reale, configurare pulizia periodica o dichiarare questa conservazione effettiva nell'informativa. Un batch oltre la finestra di conservazione non garantisce idempotenza e non va ritentato.

Timeout10s per adattatore con AbortSignal; esito ambiguo non viene ritentato automaticamente, perché il fornitore potrebbe aver già accettato. La selezione completa può richiedere fino a200secondi nel caso peggiore. Un servizio operativo dovrà avere timeout di ingresso coerenti oppure un trasporto asincrono: non è stato eseguito alcun test di carico o consegna reale.

## Verifiche

Test helper/controller, API e quote su SQLite reale con adattatore simulato; gate e prenotazione concorrente nel Worker compilato/D1 locale; browser mobile con selezione di tutti, esclusione di uno, nota12px, anteprima, simulazione e salto. Nessun accesso a rubrica o invio esterno durante i test.
