# Facciamo Balotta

App Expo / React Native per web, iOS e Android. Prima anteprima illustrativa privata, con un backend OAuth preparato separatamente. Dati, persone ed eventi dimostrativi sono fittizi; non esiste ancora un servizio pubblico di appuntamenti.

## Avvio

Richiede Node >=24.3.0.

```sh
npm ci
npm test
npm run typecheck
npm run web
```

`npm start`, `npm run ios` e `npm run android` usano Expo. Le integrazioni OAuth native richiedono una development build con lo schema `facciamobalotta`, non una semplice sessione Expo Go.

```sh
npm run export:all
```

L'export verifica e produce bundle JavaScript per web/iOS/Android. **Non produce IPA/APK firmati e non dimostra collaudo nativo.** `eas.json` prepara build preview, simulatore, TestFlight e Android internal testing; nessun project ID o app ID di Fungo Italia è riutilizzato.

## Cosa si può provare

- Schermata illustrata originale tra portici, colli e Riviera.
- Attività di esempio filtrabili per provincia e interesse.
- Richiesta simulata di partecipazione e approvazione nel ruolo di organizzatore.
- Persona proposta, interesse reciproco simulato, proposta appuntamento e due conferme sulla stessa versione.
- Modifiche di data e attività che annullano le conferme precedenti.
- Selezione illustrativa degli interessi senza salvataggio o invio del profilo.

L'IA non è attiva: nessun profilo è inviato a servizi AI e non vengono inventati punteggi di compatibilità. Chat, notifiche, calendario di disponibilità, creazione completa delle attività e transazioni multiutente di gruppo restano incrementi successivi.

## Accessi reali

Google e Facebook richiedono credenziali sviluppatore e un backend HTTPS. Apple è previsto per iOS; Instagram non è supportato come login. Niente email/password, SMS o account aggiuntivi in questa versione.

Il server usa OAuth provider/subject, sessioni opache con hash in SQLite, protezione dello stato OAuth, allowlist beta controllata sul server e handoff nativo con codice monouso legato a un verifier PKCE. Due provider con la stessa email non vengono uniti automaticamente.

Il client non attiva l'accesso se `EXPO_PUBLIC_API_URL` non è configurato. Il server non abilita provider senza `OAUTH_ENABLED=true` e relativi parametri. Nessun segreto deve avere il prefisso `EXPO_PUBLIC_`.

Per usare l'API, configurare le variabili del file `.env.example` nell'ambiente, poi:

```sh
node --env-file=.env server/index.mjs
```

L'API e il client devono essere pubblicati sul medesimo origin HTTPS, instradando `/api/*` e `/auth/*` al server. Il server Node ascolta sul loopback dietro un reverse proxy; il reverse proxy deve limitare le richieste per visitatore reale e servire gli asset web. La protezione per IP va configurata sul proxy: usare il suo IP loopback come chiave nell’app penalizzerebbe tutti gli utenti insieme. L'anteprima Sites ospita soltanto il client illustrativo e non ospita il processo Node né il database SQLite.

Leggere [la configurazione beta](docs/BETA_SETUP.md), [il piano fisico](docs/PIANO_MARKETING_FISICO.md) e [il piano esecutivo](docs/superpowers/plans/2026-11-06-first-demo.md).

## Asset

Illustrazioni generate per questo progetto, con riferimenti culturali e personaggi originali; font originale Balotta Inchiostro per i titoli, Kalam e Comic Neue per note e testi. Le licenze dei font esterni sono incluse nei rispettivi pacchetti OFL. Piccole illustrazioni SVG scritte nel progetto. Il logo è un disegno di lavoro e non implica disponibilità del marchio.

## Repository principale

Lo sviluppo prosegue nella repository privata `gianpaolobol/facciamo_balotta`. Questo trasferimento include sorgenti, test, documentazione, font, immagini ottimizzate e originali delle illustrazioni. Gli originali PNG degli eventi restano archiviati ma esclusi dagli export dell’app, che importano i JPEG. La cartella `dist` si rigenera con i comandi sopra.

## Prossimo sviluppo approvato

Profilo illustrato: descrizione facoltativa dell’aspetto per un ritratto, descrizione degli interessi con conferma dell’utente e fino a cinque immagini distinte, una per interesse. Stile coerente con la direzione grafica approvata; rigenerazione singola. Matching basato su interessi, intenzioni e disponibilità, senza analisi estetica del ritratto. La generazione personale non è ancora collegata. Nessuna chiave API è stata creata; la creazione è autorizzata, la destinazione sicura è da definire senza inserire segreti nei sorgenti.
