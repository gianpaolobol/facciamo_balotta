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
| Aggiornamenti | Inbox interna, lettura personale e lettura collettiva degli aggiornamenti visibili; nessun push o email esterno |

Le schermate live non simulano azioni dell'altra persona. La demo è separata ed esplicitamente fittizia. Ogni account rimonta i pannelli privati, evitando di mantenere dati del precedente utente.

## Controlli svolti

Test di regole, API/SQLite e D1 locale; Worker compilato eseguito in Miniflare, con provider sintetici; TypeScript ed export Expo. Prova browser mobile con due sessioni sintetiche: interesse reciproco, proposta, doppia conferma, chat, modifica che azzera entrambe le conferme, creazione/richiesta/approvazione gruppo. Risultati finali:195/195 test generali e9/9 Worker, TypeScript ed export web/iOS/Android superati; migrazioni locali applicate. Dettagli e punto di ripresa in CONTINUITA.md.

La revisione indipendente ha prodotto regressioni per revoca consenso, lettura atomica delle immagini, incontri passati, coda segnalazioni e segnalazione di gruppi visibili prima dell'ammissione. I difetti sono stati riprodotti e corretti. Una seconda revisione delle notifiche non ha trovato difetti importanti; aggiunta l'azione di lettura totale per svuotare anche gli aggiornamenti oltre la prima pagina.

Queste prove non sono login Google/Meta/Apple reali, generazioni Workers AI reali, build firmate o test su telefoni.

## Attivazione ancora necessaria

1. Usare un ambiente normalmente autorizzato a Cloudflare: quello dell'agente ha un diniego di rete esplicito e non viene aggirato con proxy o altri runner.
2. Verificare Workers Free; configurare D1/origin reali e applicare tutte le migrazioni0001–0009. Origin e ID del repository sono ancora segnaposto; workers_dev e preview URLs disattivati.
3. Configurare Google/Meta e Apple per il bundle it.facciamobalotta.app, callback HTTPS, allowlist beta, secret Apple e server notification endpoint. Nessun secret in EXPO_PUBLIC_ o Git. Configurare MODERATOR_EMAILS per avere un referente reale alle segnalazioni.
4. Verificare piano gratuito/quote e due generazioni Cloudflare reali. Font e riferimenti sono preservati, ma non è dimostrato che il modello produca risultati identici alla grafica approvata.
5. Completare informative/termini con titolare, contatti, fornitori e conservazione effettivi. Le regole della beta nel client non sono documenti legali approvati per pubblicazione.
6. Collegare il nuovo progetto Expo/EAS e le schede store, configurare API HTTPS e firme, produrre IPA/AAB/APK e provare su iPhone/iPad/Android con due account reali. Si può usare l’account sviluppatore del titolare con identificativi dedicati alla nuova app; non copiare automaticamente client OAuth, provisioning o secret di Fungo Italia.
7. Abilitare i flag soltanto dopo questi collaudi. check:release rimane ready=false perché le prove reali non sono state eseguite.

Push nativi APNs/FCM non implementati né configurati: gli aggiornamenti disponibili sono interni all'app, e le chat richiedono aggiornamento manuale. La beta non promette consegne in background. Un'eventuale integrazione push va trattata come incremento esplicito e collaudata sui telefoni.

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
