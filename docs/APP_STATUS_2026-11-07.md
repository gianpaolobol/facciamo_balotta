# Facciamo Balotta — beta funzionale

Il codice della beta collega i percorsi multiutente web/iOS/Android mantenendo font, illustrazioni e demo originali. I servizi non sono pubblicati né attivati per persone reali. La PR resta separata da main e dall'anteprima precedente.

## Implementato

| Funzione | Comportamento |
| --- | --- |
| Accesso | Google/Facebook con backend HTTPS e handoff PKCE nativo; Apple nativo, revoca con conferma fresca e notifiche di revoca |
| Profilo illustrato | Ritratto e cinque interessi, salvataggio/versioni, conferme, anteprima, approvazione/rigenerazione/scarto |
| Condivisione | Solo illustrazioni approvate, con consenso e autorizzazione verificati nello stesso snapshot SQL; niente prompt privati o email |
| Matching | Consenso esplicito, adulti dichiarati, interessi/intenzioni/disponibilità compatibili, provincia o regione; una proposta attiva, nessuna valutazione estetica |
| A due | Interesse reciproco, appuntamento con due conferme sulla stessa versione; modifiche azzerano i sì; ritiro/annullamento e storico |
| Gruppi | Creazione, richieste, approvazione/rifiuto organizzatore, capienza atomica, uscita/annullamento |
| Chat | Coppie reciproche e membri approvati, testo, idempotenza, limiti persistenti e aggiornamento manuale |
| Sicurezza | Blocchi bilaterali, segnalazioni, sospensioni; moderazione riservata a email verificate configurate sul server |
| Inviti ai contatti | Rubrica autorizzata nativa, solo nomi, scelta WhatsApp/SMS/email e coda di composer individuali; mittente personale visibile, nessuna rubrica al backend |
| Aggiornamenti | Inbox interna, lettura personale e lettura collettiva degli aggiornamenti visibili; trasporto push nativo facoltativo predisposto e spento; nessun invio reale o email |

Le schermate live non simulano azioni dell'altra persona. La demo è separata ed esplicitamente fittizia. Ogni account rimonta i pannelli privati, evitando di mantenere dati del precedente utente.

## Controlli svolti

Test di regole, API/SQLite e D1 locale; Worker compilato eseguito in Miniflare, con provider sintetici; TypeScript ed export Expo. Prova browser mobile con due sessioni sintetiche: interesse reciproco, proposta, doppia conferma, chat, modifica che azzera entrambe le conferme, creazione/richiesta/approvazione gruppo. Risultati finali:276/276 test generali e11/11 Worker, TypeScript ed export web/iOS/Android superati; migrazioni locali applicate. Dettagli e punto di ripresa in CONTINUITA.md.

La revisione indipendente ha prodotto regressioni per revoca consenso, lettura atomica delle immagini, incontri passati, coda segnalazioni e segnalazione di gruppi visibili prima dell'ammissione. I difetti sono stati riprodotti e corretti. Una seconda revisione delle notifiche non ha trovato difetti importanti; aggiunta l'azione di lettura totale per svuotare anche gli aggiornamenti oltre la prima pagina.

Queste prove non sono login Google/Meta/Apple reali, generazioni Workers AI reali, build firmate o test su telefoni.

## Attivazione ancora necessaria

1. Usare un ambiente normalmente autorizzato a Cloudflare: quello dell'agente ha un diniego di rete esplicito e non viene aggirato con proxy o altri runner.
2. Verificare Workers Free; configurare D1/origin reali e applicare tutte le migrazioni0001–0011. Origin e ID del repository sono ancora segnaposto; workers_dev e preview URLs disattivati.
3. Configurare Google/Meta e Apple per il bundle it.facciamobalotta.app, callback HTTPS, allowlist beta, secret Apple e server notification endpoint. Nessun secret in EXPO_PUBLIC_ o Git. Configurare MODERATOR_EMAILS per avere un referente reale alle segnalazioni.
4. Verificare piano gratuito/quote e due generazioni Cloudflare reali. Font e riferimenti sono preservati, ma non è dimostrato che il modello produca risultati identici alla grafica approvata.
5. Completare informative/termini con titolare, contatti, fornitori e conservazione effettivi. Le regole della beta nel client non sono documenti legali approvati per pubblicazione.
6. Progetto Expo/EAS dedicato ora creato e collegato: completare le schede store, configurare API HTTPS e firme, produrre IPA/AAB/APK e provare su iPhone/iPad/Android con due account reali. Si può usare l’account sviluppatore del titolare con identificativi dedicati alla nuova app; non copiare automaticamente client OAuth, provisioning o secret di Fungo Italia.
7. Abilitare i flag soltanto dopo questi collaudi. check:release rimane ready=false perché le prove reali non sono state eseguite.

Push nativi predisposti con Expo: consenso esplicito, token cifrati, revoca sessione, quote atomiche e ricevute. Tutto spento per default; nessun cron o invio reale. APNs/FCM/EAS e build firmate restano da configurare/collaudare. Leggere NATIVE_PUSH.md. Le chat richiedono aggiornamento manuale; nessuna consegna in background è stata provata.

Verifiche dell'incremento push:230/230 test generali,10/10 Worker compilato/D1, TypeScript ed export tutte le piattaforme exit0. Revisione indipendente: corretti con regressioni RED→GREEN scadenza della sessione durante elaborazioni e starvation della coda dovuta a notifiche ormai invisibili.

## Gratuità e limiti

Nessun nuovo servizio a pagamento o ricarica attivati. Workers AI è disabilitato senza conferma manuale del piano Free; nessun fallback a pagamento. Le quote e i limiti applicativi restano intenzionalmente finiti: immagini200MB complessivi,50tentativi AI globali/giorno e12perutente; messaggi5000complessivi e20/minuto per mittente; segnalazioni5000complessive e5nuove/giorno per autore; notifiche100perdestinatario. Al limite si restituisce un errore, senza cambiare piano.

Il flag Free è un'attestazione dell'operatore, non una verifica automatica della fatturazione Cloudflare. Monitoraggio e prove di carico sono necessari prima di un'apertura pubblica.

## Guide tecniche

- WORKERS_SETUP.md: runtime/migrazioni e configurazione.
- APPLE_NATIVE_SETUP.md: accesso, revoche e secret server.
- MEETINGS_API.md, GROUPS_API.md, COMMUNITY_API.md, NOTIFICATIONS.md: contratti sociali.
- scripts/check-social-web.mjs: prova browser locale ripetibile con dati sintetici.

Per la prova browser esportare il web con EXPO_PUBLIC_API_URL=http://127.0.0.1:8768 in dist-social-qa e usare Playwright/Chromium locali con PLAYWRIGHT_MODULE_PATH/BROWSER_EXECUTABLE_PATH. È solo un ambiente di test; l'export destinato alla configurazione reale non deve contenere questo origin locale.

Per il web reale servire bundle statico e API dallo stesso origin HTTPS, come nella prova locale, oppure predisporre esplicitamente CORS/callback per il frontend scelto. Il Worker di esempio è API-only. I client nativi usano bearer e handoff PKCE senza dipendere dall’hosting web.

## Stato GitHub Actions

Sul commit di codice5681326d2707eb3b3c684cc12b75c302bacbdd87 il run42404274263 (job128498490018) termina failure dopo due secondi, con elenco step vuoto: i comandi non vengono avviati. Le annotazioni sono state lette direttamente nel browser GitHub: il servizio indica una restrizione di Billing & plans, relativa a pagamenti recenti o al limite di spesa. Il messaggio non distingue quale delle due condizioni sia attiva. Non sono state effettuate modifiche di fatturazione o budget. I195+9 test riportati sono prove locali, non un CI GitHub superato. Non sono stati attivati minuti/piani a pagamento o runner alternativi.


## Incremento inviti

La richiesta successiva ha sostituito l'inserimento manuale con rubrica autorizzata e soli nomi: WhatsApp, SMS, email personali. Nota piccola veritiera sul mittente visibile. Nessun contatto caricato al backend, invio automatico o gruppo; ogni apertura richiede gesto e conferma nel canale personale. Il vecchio adapter anonimo è separato/spento. EXPO_PUBLIC_INVITATION_URL non configurato, nuova build e prove fisiche mancanti. Dettagli in INVITATIONS.md.276/276 test,11/11 Worker compilato/D1, typecheck/export tutte piattaforme e browser mobile superati; nessuna rubrica reale letta o messaggio spedito.

## Distribuzione predisposta

Progetto Expo verificato e icone native/archivio pulito pronti. Non esistono ancora IPA/AAB firmati, upload o release. Apple login necessario; Play modulo precompilato e non inviato, dichiarazioni legali del titolare in sospeso. Vedere DISTRIBUTION_2026-11-07.md per i blocchi reali e i passi verso TestFlight/test interno Play e successiva produzione.
