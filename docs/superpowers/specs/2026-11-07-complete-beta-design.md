# Completamento funzionale della beta

Richiesta esplicita dell'utente: procedere autonomamente e completare l'app iOS/Android. Conservare grafica/font/asset approvati, demo e profilo illustrato già implementati. Completare i percorsi reali del client con API persistenti, senza inventare utenti, matching AI o pubblicazioni reali.

## Matching e appuntamenti
Preferenze private: consenso esplicito a comparire, intento amicizia/appuntamenti/entrambi, disponibilità fra weekday_day/weekday_evening/weekend_day/weekend_evening e ambito province/region. Default non visibile. Matching deterministico spiegabile per interessi dichiarati, intento e disponibilità compatibili; stessa provincia salvo entrambi scelgano regione. Solo Emilia-Romagna, adulti dichiarati, nessun ritratto/valutazione estetica. Un solo candidato attivo per persona, nessuno scorrimento infinito. Blocchi e sospensioni escludono immediatamente. Dopo due interessi si aprono proposta versionata e chat. Rifiuto ripetibile, possibile ritirare interesse con annullamento atomico dell'appuntamento.

## Gruppi
Adulti autenticati creano attività con titolo/descrizione, provincia, categoria, data ISO futura entro180giorni, luogo dichiarato pubblico, costo e capienza2–20. Organizzatore conta tra i posti. Gli altri richiedono partecipazione; solo organizzatore approva/rifiuta. Ultimo posto atomico. Membri approvati accedono alla chat; richieste in attesa non danno accesso. Annullamento organizzatore e uscita membro, nessuna prenotazione/pagamento automatico. Liste50 e privacy: nessuna email o lista completa di richiedenti ai non organizzatori. Blocchi impediscono nuove interazioni e visibilità condivisa.

## Chat e sicurezza
Chat testuale tra coppie con interesse reciproco e membri approvati dei gruppi, senza media o link eseguiti. Messaggi1–1000caratteri,20/minuto per mittente, idempotenza con ID client, ultimi50 e budget5000messaggi globali per quota gratuita. Autorizzazioni e blocchi ricontrollati nel write atomico. Nessun servizio esterno o invio email/push non richiesto.

Blocco/sblocco, elenco propri blocchi, segnalazione utente/gruppo/messaggio con motivo. Moderazione manuale tramite allowlist server di email verificate; nessun privilegio selezionabile nel client. Sospensione impedisce servizi sociali e nuove proposte, mantenendo accesso a cancellazione e logout. Trattare segnalazioni e dettagli solo per moderatori autorizzati. Eliminazione account rimuove dati privati con cascata. Flag disabilitati finché configurazione e collaudo reali non sono pronti.

## Client
Schermate live distinte dalla demo: Scopri attività reali, A due con candidato/preferenze/appuntamento/chat, Le mie balotte con creazione/richieste/chat, Profilo con preferenze/sicurezza e moderazione solo quando autorizzata. Stato vuoto, errori, caricamento, conflitti e azioni in corso espliciti. Nessun comando che simuli l'azione dell'altro utente in live. Nessuna notifica o registrazione implicita a servizi.

## Limiti esterni
Nessun aggiramento della policy Cloudflare, deploy alternativo per superarla, credenziale reale o spesa. Nessun test sintetico dichiarato prova OAuth/AI reale o build firmata. Restano necessariamente ambiente HTTPS/configurazione, firme/build/store, due generazioni Cloudflare reali e prove su telefoni. Informative definitive richiedono dati reali del titolare/fornitori: testi di lavoro non sono dichiarati approvati per pubblicazione.
