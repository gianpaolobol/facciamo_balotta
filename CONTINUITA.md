## Errore Apple dopo la conferma — 12 novembre 2026

- Individuata la causa del 503: Cloudflare Workers rifiuta `redirect: 'error'` nella richiesta delle chiavi Apple. Correzione con `manual` e rifiuto delle risposte non 2xx, applicata anche alle richieste Apple per la revoca.
- Il test mirato fallisce sul codice precedente e passa con la correzione. Verificati 281 test Node e 11 test Worker/D1. Worker pubblicato via Wrangler alle 16:13 italiane circa, versione `a6a28ca5-42d8-48ee-8288-7914f9f0c6d6` al 100%, con binding e variabili verificati. In remoto Apple attivo, avvio HTTP 200 e chiave di prova non valida rifiutata HTTP 401 durante lo scambio.
- Il primo tentativo reale dopo il deploy ha raggiunto la verifica dell’invito. Aggiunto alla lista beta l’indirizzo Apple fornito dal tester e verificata la versione `ca986b4a-254e-4b6b-9a0a-4f10c04e0caf` attiva al 100%. Resta da confermare l’accesso con la build già installata.
- Su TestFlight 1801 l’utente ha riportato `RequestUnknownException` dopo la conferma Apple, prima di inviare il token. Firmatura e profilo della 1801 includono l’abilitazione e Apple Developer conferma l’App ID primario. Rimane il collaudo reale su iPhone e, se persiste l’errore nativo, la raccolta della diagnostica iOS.

## Beta Apple e TestFlight 1801 — 12 novembre 2026

- Sign in with Apple attivato sul Worker per un solo account autorizzato. Team ID, Key ID e chiave privata risultano binding Cloudflare Secret. Google e Facebook ancora disattivati. HTTPS /api/config dichiara Apple attivo e /auth/apple/native/start restituisce 200 con challenge.
- iOS 0.1.0 (1801) compilata, firmata e caricata su Apple nel run 43143789149. App Store Connect ha restituito la build in stato VALID e l'appartenenza al gruppo interno esistente «Balotta demo», verificata nel run 43145931800. Build ID 6acd8847-93a4-4249-b031-458321e07df1.
- Restano da provare su iPhone accesso Apple reale, riapertura con sessione e cancellazione con revoca. Una versione precedente del Worker conteneva la chiave Apple come Text; il deploy attivo usa Secret. Rotazione della chiave da pianificare.

## Backend Cloudflare pubblicato — 12 novembre 2026

- Wrangler autenticato con OAuth Device Grant, autorizzazione Workers e D1 completata sullo stesso account. Database `facciamo-balotta` creato nella giurisdizione UE. Tutte le 11 migrazioni remote applicate e lista migrazioni pendenti vuota.
- Worker `facciamo-balotta-api` pubblicato su [workers.dev](https://facciamo-balotta-api.gianpaolo-franceschini.workers.dev/api/config), versione `77ca0799-6845-4973-85f6-799018b92d95`. Verificata risposta HTTPS 200 della configurazione pubblica. La route di sessione richiede autenticazione.
- Google, Facebook e Apple ancora disattivati in attesa dei client/secret, callback e allowlist reali. Nessuna impostazione di fatturazione modificata. Il binding Workers AI è escluso da questo deploy.
- Il file di esempio del repository conserva i segnaposto per le prove locali. Per i deploy remoti usare il database D1 esistente e impostare `PUBLIC_ORIGIN` all'URL HTTPS del Worker. Registrare l'URL del backend nelle build native dopo aver configurato i provider.

## Demo interna e accessi reali — 12 novembre 2026

- Le build 1601/2401 portavano il tester alla schermata di accesso senza percorso dimostrativo. La demo con dati fittizi è ora selezionabile esplicitamente nei due workflow nativi con enable_demo. La build ordinaria tiene questa opzione disattivata. Il pulsante «Prova la demo» apre direttamente Scopri, A due, Le mie balotte e Profilo senza account.
- I pulsanti nativi Google e Facebook sono visibili quando il backend dichiara il provider attivo. Apple rimane nativo iOS. I tre adattatori OAuth e le sessioni sono già nel repository. Servono un Worker HTTPS con D1, configurazione dei tre provider e verifica dei login reali su dispositivi. L'ultimo accesso Cloudflare con Google è stato respinto e BALOTTA_API_URL non è stata configurata. TestFlight/Play concedono accesso alla build, non alla beta OAuth.
- PR #9 integrata con CI riuscita, 280 test locali, TypeScript ed export Expo superati. Build interne con demo esplicitamente attiva avviate: iOS 43128185615 e Android 43128185800. Distribuzione ai tester ancora da verificare.
- I flussi interni si possono provare con una nuova build che abilita la demo. Per collaudare l'accesso reale, verificare prima /api/config sull'origin distribuito, registrare Google e Meta per quel callback e provare Apple, Google e Facebook con un account autorizzato. Il risultato richiesto è la sessione persistente dopo riapertura dell'app e il profilo reale.

## Testata Facciamo Balotta! — 12 novembre 2026

- La testata della home e dei pannelli mostra il nome completo «Facciamo Balotta!». Lettering dedicato basato sul disegno di Balotta Inchiostro: fascia rossa, contorni più pesanti e ombra sfalsata, con ingombro responsivo. L'icona C2 resta l'icona delle build.
- Verificati 279 test Node, TypeScript ed export web/iOS/Android. [Verifica visiva su GitHub](https://github.com/gianpaolobol/facciamo_balotta/actions/runs/43123998656) superata a 320, 375, 430 e 1024 px. La testata e il tasto Accedi rientrano nella stessa riga e non si sovrappongono.
- PR #8 integrata. Commit applicativo `418ca027d5b187470b9dadbfc59cdde9b85599b1`.
- iOS **0.1.0 (1601)** compilata, firmata e inviata nel run 43124220110. Elaborazione completata e gruppo interno «Balotta demo» verificato in App Store Connect.
- Android **0.1.0 (2401)** compilata nel run 43124219649 e firmata nel run 43126192316. Verificati i checksum, la firma e la versione; Google Play mostra «Disponibile per i tester interni».
- Collaudo sui telefoni fisici da confermare.

## Distribuzione interna C2 — 12 novembre 2026

- Codice app integrato con PR #7; commit delle build native `f2989eb7f55d5da089b75e3961f54edf2de0d0dc`. CI della PR riuscita. Nessun rilascio in produzione.
- iOS **0.1.0 (1501)**: build firmata, IPA verificata e ricevuta da Apple nel run [43120260022](https://github.com/gianpaolobol/facciamo_balotta/actions/runs/43120260022). Elaborazione completata e build aggiunta al gruppo interno esistente «Balotta demo». Verificati gruppo, build 1501 e salvataggio delle istruzioni di prova in App Store Connect.
- Android **0.1.0 (2301)**: AAB compilato nel run [43120262046](https://github.com/gianpaolobol/facciamo_balotta/actions/runs/43120262046) e firmato nel run [43122081686](https://github.com/gianpaolobol/facciamo_balotta/actions/runs/43122081686). Verificati checksum, firma, package, versione e presenza dell'icona C2 nel binario. La release 3 «Nuova icona Balotta» risulta disponibile per i tester interni nel canale Google Play attivo.
- Collaudo delle due nuove build su dispositivi fisici da confermare. Le build servono a verificare icona, avvio e schermata iniziale. Il backend remoto non è attivo: dopo l'autorizzazione esplicita del titolare, Cloudflare ha restituito «Unable to sign in» nel flusso con Google. D1 remoto, OAuth e variabile BALOTTA_API_URL ancora da configurare.

## C2 approvata e preparazione delle nuove build — 12 novembre 2026

- C2 approvata l'8 novembre: tavolata, amici in spiaggia e bici in discesa dai colli. Sorgente autorizzato: «Amici tra tavola, mare e colline.png». Il master di lavorazione in assets/brand/c2-approved.jpg alimenta il PNG iOS e il livello adattivo Android. Intestazione dell'app: BALOTTA!.
- I percorsi con dati fittizi restano nell'anteprima web. Le build native aprono l'accesso, mostrano i provider effettivamente disponibili e leggono l'URL pubblico dell'API dalle variabili di build.
- Verifiche locali: 279 test Node, 11 test Worker/D1, TypeScript ed export web/iOS/Android superati. Le build firmate e il collaudo sui telefoni sono passaggi distinti.
- Controllo GitHub: nessuna variabile di repository o ambiente impostata nella pagina Actions. D1 remoto, origin HTTPS, OAuth reale e accesso ai provider restano da configurare. Senza URL API le build permettono di verificare icona e interfaccia iniziale, e mostrano che l'accesso non è disponibile.
- Per la beta operativa, configurare il backend come da docs/WORKERS_SETUP.md e impostare BALOTTA_API_URL con l'origin HTTPS in GitHub Actions. BALOTTA_INVITATION_URL è opzionale e contiene il link pubblico ufficiale. Configurare i segreti dei provider solo sul backend e ripetere la build dopo aver verificato gli accessi reali.

## Aggiornamento finale tasti e loghi — 8 novembre 2026

- iOS 0.1.0 (1401) disponibile nel gruppo TestFlight Balotta demo; 1301 mantenuta come precedente.
- Android 0.1.0 (2201) — Tasti ripuliti pubblicata: canale Test interni ATTIVO, UI conferma Disponibile per i tester interni; release2 sostituisce2101. Lista titolare e accessi invariati. Produzione non pubblicata.
- Codice app compilato da165a147d4f79e5c0dfeaf853814d56dde3303e74. 277 test e QA web14schermate superati; verifica visiva su telefoni fisici ancora attesa.
- Quattro proposte logo A/B/C/D generate e mostrate: quasi assonometrica, prospettica espressiva, intermedia semplificata, volo d'uccello. Scelta utente pendente; logo applicato invariato. Prompt in docs/LOGO_PROPOSTE_2026-11-08.md.
- Prove UI locali: /workspace/scratch/balotta-play-2201-published.jpg e /workspace/scratch/balotta-testflight-tasti-1401-1794155418477.jpg. Non sono prove di avvio su device.

### Checkpoint precedente

## Contorni pulsanti corretti: TestFlight1401 disponibile, Android2201 in rilascio (8 novembre 2026)

- PR5 integrata in165a147d4f79e5c0dfeaf853814d56dde3303e74: rimosso secondo InkFrame da Button, bordo nativo/ombra/testo/icone/azioni/stati invariati. Review senza rilievi importanti. CI42498299054/42498303353/42498474172 SUCCESS (277test, TypeScript, export, Worker/D1).
- PR6 integrata in598c561760fb85861e86740e11df3e052d6af185: solo QA/documentazione logo, codice app identico al buildsource165a147. QA web42499627337 SUCCESS:14schermate375/430px, geometria dei controlli con bordo, apertura attivita/selezione/anteprima/salta inviti, nessun errore JS; screenshot login/Scopri verificati visivamente puliti. Artifact13623854856. Non e prova visiva sul telefono iOS/Android. Primo QA falliva sul wordmark ruotato senza bordo: corretto lo scopo del controllo ai pulsanti con bordo; nessun cambiamento al logo per passare il test.
- iOS1401 run42498534958 SUCCESS; artifact13625310398, ZIP42288244byte SHA2560fd4ba347993b92aab047e955e9b6962710e1b3d0242280e5f20d705ae2c5f07. Apple processing concluso, buildd05fdf1e-0029-440d-ada9-4cf954014931 aggiunta al gruppo interno Balotta demo. UI finale1Tester/2Builds:1401 Testing e1301 conservata per recupero. Nessun nuovo tester/invito/segreto. Screenshot /workspace/scratch/balotta-testflight-tasti-1401-1794155418477.jpg. Utente puo aggiornare1401 ora; conferma visiva fisica ancora attesa.
- Android2201 build42498562902 e firma42499735976 SUCCESS. Artifact unsigned13624673138, signed13625166534; AAB84740553byte SHA25681d00f94218c92eedc7e2a529109d64a92d1ec38cac18c08cdfbac28c8b3203b. Bundletool/jarsigner/certificato atteso e byte-identita dei payload prima/dopo firma PASS. Download ZIP inizialmente incompleto: ripreso correttamente via Range e verificato SHA256b05d4283555bb044cfd99f4eff72b2f45bf284f4c85cdbdf152550594c3557f2. Upload Play eseguito in bozza release2, in ottimizzazione; non ancora dichiarare2201 disponibile. Canale interno esistente conserva accesso del titolare gia autorizzato.
- Quattro proposte logo A/B/C/D generate e mostrate all'utente, registrate con prompt in docs/LOGO_PROPOSTE_2026-11-08.md. A quasiassonometrica; B prospettica/gestuale; C intermedia/sintetica; D alta a volo d'uccello. Nessuna scelta ancora espressa, nessun logo/icona nuovo installato.
- Nessun Expo cloud/API, piano a pagamento o nuovo accesso. Ambiente locale ricreato parzialmente perche precedente checkout non piu presente; install offline incompleta, verifica completa svolta su GitHub. Non ripetere recuperi storici asset.

## Pulizia contorni pulsanti e proposte logo (8 novembre 2026)

- Screenshot utente IMG_0562..IMG_0567 mostrano un secondo contorno schiacciato sui tasti e in alcuni casi fuori dal loro rettangolo, su home/login/Scopri/inviti/profilo. Componente comune src/ui.tsx Button monta InkFrame SVG assoluto al100% oltre al bordo nativo: la sovrapposizione e la fonte dei segni aggiuntivi; il layout percentuale SVG nativo non coincide con il pulsante nelle schermate ricevute.
- Correzione minima: rimuovere InkFrame dal rendering di Button e relativo import, mantenendo bordo nativo asimmetrico, ombra, testo, icone, touch e stato disabilitato. Nessuna nuova grafica logo installata. Conferma richiesta utente: prima pulire tasti, poi mostrare piu proposte del dado con persone/situazioni sulle facce e punti di vista quasi assonometrico/prospettico/intermedio/dall'alto.
- Baseline visiva sono le schermate native dell'utente. CI completa/typecheck/export e prova aggiornata ancora da eseguire. Non affermare che TestFlight1301/Android2101 gia contengano questa modifica. Install offline locale non completata per pacchetti npm non presenti in cache, nessuna chiamata a Expo API. Usare CI su GitHub per verifica completa senza ampliare rete.

## Test interno Android attivo per il titolare (8 novembre 2026)

- L'utente ha confermato esplicitamente indirizzo e scopo: abilitazione del proprio account Google come tester interno Balotta. Il precedente rifiuto auto-review e superato soltanto per questa specifica autorizzazione; non chiedere nuovamente.
- Verificata in UI la lista Balotta — titolare: un solo indirizzo, coincidente con quello confermato. Selezionata soltanto questa lista e Salva completato. UI finale: canale Attivo, ultima release0.1.0(2101), lista selezionata1utente, Salva disabilitato. Altre liste non selezionate.
- Link verificato direttamente: https://play.google.com/apps/internaltest/4701130742288008384 . Pagina autenticata del titolare mostra invito per it.facciamobalotta.app(unreviewed) e pulsante Accept invite. Non premuto: accettazione invito/condivisione informazioni e installazione restano da completare dall'utente. Nessuna prova su Android fisico.
- Screenshot conferma: /workspace/scratch/balotta-android-tester-attivo-1794153082216.jpg. Nessuna email inviata, nuova build o nuova chiave. iOS1301 resta disponibile su TestFlight; apertura sul telefono dopo aggiornamento ancora non confermata.
- Test interno disponibile; produzione ancora separata e subordinata a configurazione dello store/test chiuso12tester14giorni. Servizi live/OAuth reali ancora spenti nella demo.

## Android2101 pubblicata nel canale interno; accesso tester da confermare (8 novembre 2026)

- Play app4974588436559729015/canale4701130742288008384/release1: upload elaborato, AAB2101(0.1.0)/minAPI24/target36/4ABI riconosciuta. Nome e note demo salvati. Anteprima senza errori bloccanti; unico avviso: nessun tester specificato.
- Salva e pubblica confermato; UI finale mostra0.1.0(2101) Demo Balotta, Disponibile per i tester interni, Non esaminata; canale Non attivo per assenza tester. Nome temporaneo it.facciamobalotta.app(unreviewed) fino a configurazione/revisione. NON e pubblicazione pubblica in produzione e al momento nessun account ha accesso al test Android.
- Creata lista account Balotta — titolare con un solo account del titolare, selezione non salvata. Auto-review ha RIFIUTATO il salvataggio dell'accesso al tester per mancanza di autorizzazione esplicita a quel destinatario/scopo. Non ripetuto, non aggirato e nessun elenco di altre app selezionato. Serve conferma puntuale dell'indirizzo Google del titolare per test interno Balotta; indirizzo non pubblicato in Git. Tab67 conserva selezione in attesa. Dopo conferma: verificare lista/indirizzo in UI e salvare, quindi verificare accesso e link; non ricompilare o creare un'altra chiave.
- Dichiarazioni Google e chiave upload dedicata gia confermate, eseguite e verificate; non richiederle di nuovo. Segreti Android cifrati in GitHub e firme native completate; copie private locali eliminate. Fonte app d0eb9f8, build42438885222, firma42443822131; SHA256AAB189cc3c52f517de75d5e5dc095e6a068d1fa5bce690015dc53c9beb7eb838d40.
- Prova screenshot finale /workspace/scratch/balotta-play-internal-2101-1794110237614.jpg. Tab68 mostra release pubblicata; vecchia pagina upload tab10 era non responsiva, stato ricevuto e riconosciuto tramite raccolta della stessa console, senza duplicare upload.
- Produzione richiede completare configurazione/contenuti e test chiuso12tester/14giorni consecutivi, attualmente0. La demo conserva dati di esempio/servizi live spenti. Nessuna prova fisica Android o conferma apertura fisica iOS1301 in questo blocco.
- iOS1301 gia Testing su TestFlight; ora la build Android interna e pubblicata ma l'abilitazione del titolare resta il solo salvataggio bloccato in questa fase.

## Android2101 firmata e validata, upload Play in corso (8 novembre 2026)

- PR4 integrata:5b82b74d13342bfa1720f7b0d4aa3ffddfa0dc3a. CI42443600766/42443603258 SUCCESS. Firma42443822131/job128618452273 SUCCESS: provenienza, bundletool ufficiale, package/versione/assenza WRITE_CONTACTS/debuggable, certificato e jarsigner strict PASS.
- Artifact firmata13602563414, balotta-android-play-1-1:ZIP84250988byte SHA2564f1b0d9e011975572f98df96d11f182fdc67cba99a99bb7d8b2bc8b272546a69. AAB84740548byte SHA256189cc3c52f517de75d5e5dc095e6a068d1fa5bce690015dc53c9beb7eb838d40,0.1.0/2101. Scaricata, ZIP integro; ogni payload pre-firma identico e certificato PKCS7 letto localmente corrisponde alla chiave dedicata attesa. Nessuna prova di avvio Android fisico.
- Due nuovi segreti Android verificati in UI e usati con successo dal runner. Eliminate copie private locali balotta-upload.p12/store-password.txt/keystore-base64.txt: conservati soltanto certificato e metadati pubblici; credenziali cifrate GitHub restano disponibili per firme future.
- Play app4974588436559729015, canale interno4701130742288008384, bozza release1. Nome0.1.0(2101) Demo Balotta e note italiane esplicitano dati di esempio/accessi e multiutente reali non attivi. File firmato selezionato tramite filechooser e upload in corso: verificare processing/errori e solo dopo anteprima/rollout. Nessuna release Android ancora dichiarata disponibile.
- Test chiuso di produzione ancora0tester, requisito mostrato12tester/14giorni consecutivi. Nessun invito ad altre persone inviato.

## Android: AAB compilata, scheda Play creata e firma autorizzata (8 novembre 2026)

- Utente conferma espressamente entrambe le richieste: dichiarazioni Google Play (norme sviluppatori ed esportazione USA) e creazione di chiave Android dedicata conservata nei segreti cifrati GitHub, con reinstallazione del vecchio APK se necessario. Non chiedere di nuovo per questi stessi atti.
- Dichiarazioni selezionate e Crea app inviato: dashboard Facciamo Balotta verificata, Play appID4974588436559729015, package it.facciamobalotta.app. Canale interno4701130742288008384. Non ancora caricata/rilasciata una AAB. Produzione richiede test chiuso12tester/14giorni come mostrato dalla console;0tester attuali.
- Native build42438885222/job128603638538 SUCCESS, Gradle362task/12m43s. Artifact13600868759 ZIP84172309byte SHA25637f45df11629141dee14b69f5ab9012ae9f42b70ee99a8e7124ab42ffc092e59. AAB unsigned84662463byte SHA2568f13a028b133dbb4e3244bb3f137372558a3aa8473119ce20d189facab28d481, fonte d0eb9f860b723d591e913a03a73a823af61e1ba4, versione0.1.0/2101. Scaricata e verificata:845voci, ZIPintegro, manifest/JS/DEX e4ABI, nessuna firma. Nessuna prova Android fisica.
- Creata chiave upload RSA3072/PKCS12 dedicata: alias balotta-upload, CN Balotta GitHub Android, certificato pubblico SHA256576f7e6a6ac06285def2267948fa26b8f5f19d317d6599e5b87fc715e6a3d8af, scadenza2054-03-26. Salvati e verificati in UI i soli nuovi segreti ANDROID_UPLOAD_KEYSTORE_BASE64 / ANDROID_UPLOAD_KEYSTORE_PASSWORD; segreti iOS invariati. Nessun valore privato in Git.
- android-sign.yml preparato: origine run/artifact/commit/hash verificata prima della firma, bundletool ufficiale1.18.3 con SHA256pin, controlli manifest/versione/release, firma e verifica rigorosa con certificato atteso, cleanup temporaneo, artifact solo dopo successo. Nessun upload store automatico. Review indipendente: corretto percorso download-artifact con merge-multiple:true; nessun altro rilievo importante. Sintassi YAML/Python PASS, firma effettiva ancora da eseguire.
- Copie private locali temporanee in /workspace/scratch/balotta-android-signing: eliminare dopo prova firma da segreti GitHub e conservare solo certificato/metadati pubblici. Non stampare password/base64, non sovrascrivere la chiave esistente.
- iOS1301 resta Testing su TestFlight, riscontro apertura sul telefono ancora atteso.

## Android AAB: compilazione nativa avviata (8 novembre 2026)

- PR3 integrata: d0eb9f860b723d591e913a03a73a823af61e1ba4. CI ramo42438723874 e42438747587 SUCCESS;277test/typecheck/export e prove Worker/D1. Review indipendente: nessun blocco per bundle unsigned; nota versioncode sotto.
- Workflow Android42438885222/job128603638538 sul merge d0eb9f8: npmci/test/typecheck/prebuild offline e configurazione unsigned PASS, Gradle bundleRelease in corso. Non avviare duplicati; leggere esito/log/artifact. Versioncode previsto2101.
- Ruling review: il contatore run/attempt non garantisce ordine cronologico se si ritenta un run vecchio dopo uno nuovo. Accettabile per preparazione unsigned; per futuri upload avviare un nuovo run e confrontare versioncode con Play prima della firma. Una vecchia build con codice inferiore puo essere rifiutata dallo store.
- Certificato pubblico APK demo2 letto dal blocco APKv2: SHA256 a7943bd186c5689dc15f58590ba8c3bf013cb4cfe7ffa210aad4d8dd6a3c1b40. Nessuna chiave privata recuperata. Una futura firma diversa non consente aggiornamento diretto di quell'APK: scelta da esplicitare al titolare prima di nuova firma persistente.
- Google Play Crea app verificato: nome/pacchetto/italiano/App/Senza costi pronti; entrambe dichiarazioni norme/esportazione non selezionate, nessun record creato. Nessun nuovo segreto o accesso creato. iOS1301 invariata, apertura fisica da confermare.

# Android: preparazione AAB nativa (8 novembre 2026)

- Workflow manuale android-native.yml preparato per runner standard ubuntu-latest, Node24.3/JDK17, prebuild Android offline e Gradle bundleRelease. Nessuna chiamata Expo API, nessun segreto, nuovo certificato o upload store.
- Output intenzionalmente unsigned: eliminata firma debug predefinita del template; controllo payload nativo/JS/arm64 e assenza firme JAR prima di conservare AAB, SHA256 e commit sorgente. Non installabile e non caricabile su Play finche non firmato.
-277test e TypeScript locali PASS; YAML/Python incorporato validi. Compilazione nativa ancora da avviare/verificare. Scheda Play pronta ma non creata: due dichiarazioni del titolare (norme sviluppatori ed esportazione USA) ancora non accettate. Chiave APK precedente detenuta da Expo non recuperata; non aggirare il diniego API. Concordare firma upload dedicata prima di salvare nuove credenziali.
- iOS1301 gia Testing su TestFlight; apertura sul telefono dopo aggiornamento ancora non confermata.

# Facciamo Balotta — punto unico di ripresa

## Correzione crash distribuita: TestFlight1301 Testing (8 novembre 2026)

- PR #2 integrata in main:08e2878ddd9db32c11cba57baae53bbd092c5e3e. Albero merge a2b17ae0256f630a7437a7fc8fc04c46ab93ea8b identico al candidato revisionato; modifiche dopo il codice testato edbb666 sono solo documentali.
- Baseline RED: simulatore42434693660 riproduce DYLD Symbol missing RCTStatusBarAppearance. Candidato GREEN: run42435537614 SUCCESS, avvio Release stabile25secondi, processo presente, nessun crash report; screenshot verificato mostra home Balotta con font e illustrazione caricati. Prova su iPhone16e simulato/iOS26.2, non sul telefono fisico dell'utente.
- IPA1301 run42436000873 SUCCESS, scaricata e verificata:486importfraframework e0simbolimancanti, contro1mancante nella1201. Fonte edbb666a44800633942041b0abd74cbd20ab1e19, SHA256 b9801619e99838fae01c42fa42b4920e9011f80ce2091633621bca8756c40665. Artifact13598844630 conserva IPA/checksum; artifact13600635070 conserva diagnostica sintetica/screenshot candidato.
- Apple processing concluso, build ea8da87b-c70c-4e3e-9165-09c4a6971555 associata a Balotta demo. UI finale1Tester/1Build,0.1.0(1301) Testing. Rimossa soltanto associazione1201 dal gruppo, nessuna scadenza irreversibile o revoca. Gruppo sempre con distribuzione automatica disattivata; destinatario precedente gia autorizzato, nessun nuovo tester/invito.
- Screenshot finale /workspace/scratch/balotta-testflight-1301-testing-1794104084678.jpg. Aggiornamento1301 disponibile al tester esistente tramite TestFlight. Conferma di apertura sul telefono dopo aggiornamento ancora attesa: non dichiararla eseguita da noi.
-277test/TypeScript/lock consistency e fresh CI passati; review indipendente senza rilievi importanti. Nessuna modifica a grafica, funzioni demo, servizi live o altre app. Pin Core58.0.11/JSI58.0.7/macros0.14.0 e buildFromSource legati alla matrice Expo58.0.2/RN0.88.0-rc.3; rivederli con futuri aggiornamenti SDK.

Questo esito prevale su tutte le note cronologiche successive di test/processing/merge ancora pendenti. Prossimo riscontro: utente aggiorna a1301 e apre l'app sul proprio iPhone.

## IPA1301 corretta validata, ricevuta da Apple (8 novembre 2026)

- Native run42436000873 SUCCESS, sorgente applicativo edbb666a44800633942041b0abd74cbd20ab1e19. Artifact13598844630, balotta-ios-3-1: ZIP42288445byte, SHA256 cfec79024921afa8f28267b9fa9df36c1f6b35be36e3849f80a7b81f856eb7b7.
- IPA scaricata e verificata: it.facciamobalotta.app0.1.0(1301),42431246byte, SHA256 b9801619e99838fae01c42fa42b4920e9011f80ce2091633621bca8756c40665. Audit nuovo binario:5immagini/486importfraframework/0simbolimancanti; nella1201 erano10/1605/1. Firma e controlli versione superati nel workflow prima dell'upload.
- TestFlight mostra1301 Processing, Apple buildID ea8da87b-c70c-4e3e-9165-09c4a6971555. Non ancora associata al gruppo. Vecchia1201 ancora nel gruppo, con crash noto.
- Test candidato simulatore42435537614 ancora in corso; compila arm64 e x86_64 e richiede piu tempo. Restano obbligatori esito positivo e controllo screenshot prima di distribuire1301. Baseline fallita con DYLD missing symbol e documentata.
- Dopo prova: integrare PR2, attendere Ready to Test1301, aggiungerla al gruppo Balotta demo gia autorizzato e rimuovere soltanto l'associazione della1201 dal gruppo (senza revoche di chiavi o scadenza irreversibile della build). Verifica finale sul telefono utente ancora necessaria.

Le note cronologiche successive di build1301 ancora in compilazione sono superate.

## Correzione nativa in compilazione — ripresa operativa (8 novembre 2026)

- PR #2: fix/ios-startup-20261108; codice candidato edbb666a44800633942041b0abd74cbd20ab1e19. Modifiche runtime: pin famiglia ExpoCore/JSI/macros compatibile e buildFromSource Expo; audit dei simboli prima dell'upload. Review indipendente senza rilievi importanti;277test/types/lock dry-run locali e fresh CI42435422867/42435631384 SUCCESS.
- RED riprodotto: baseline simulatore42434693660 FAILURE; console e .ips sintetico confermano DYLD Symbol missing _OBJC_CLASS_$_RCTStatusBarAppearance. TestFlight1201 crasha sul telefono; non dichiararla funzionante.
- Prova Release corretta: run42435537614/job128593959886 sul candidato edbb666, in corso. Prima di distribuire: vedere esito/processo vivo/screenshot UI e crash-report.
- Build iOS firmata corretta avviata in parallelo: run42436000873 sullo stesso candidato, build prevista1301. Gruppo Balotta demo ha distribuzione automatica disattivata: aggiungere1301 soltanto dopo prova di avvio positiva e nuovo audit IPA superato.
- Nessun nuovo segreto/permesso/servizio a pagamento. Chiavi nei segreti cifrati GitHub, nessun Expo cloud/API. I cambi checkpoint successivi al codice candidato modificano solo documentazione/metadati: mantenere corrispondenza del codice verificato.
- Main conserva ancora il codice precedente fino a merge PR2; questo checkpoint e salvato anche nel ramo candidato. Non avviare build duplicate. Dopo test: integrare PR2, verificare processing1301, associare al gruppo gia autorizzato e aggiornare lo stato.

Il resto conserva cronologia e dettagli di diagnosi.

## Crash riprodotto nel simulatore: DYLD Symbol missing (8 novembre 2026)

- Baseline run42434693660 su0c2597b: FAIL atteso. Simulatore iPhone16e/iOS26.2 termina all'avvio; console e file .ips confermano DYLD/code4/Symbol missing _OBJC_CLASS_$_RCTStatusBarAppearance, referenziato da ExpoModulesCore e atteso in React. Coincide con audit statico della IPA1201. Non e un problema di login o rubrica.
- Artifact13599018809, balotta-ios-startup-1-1, scaricato localmente in /workspace/scratch/11ca1de5100d/balotta-startup-baseline. Contiene crash report sintetico, console, log nativo e screenshot. Non confonderlo con rapporto .ips del telefono utente, ancora non disponibile.
- Correzione salvata nel ramo fix/ios-startup-20261108, commit edbb666a44800633942041b0abd74cbd20ab1e19, PR #2 bozza. Fresh npm ci/test/typecheck/export GitHub42435422867 SUCCESS. Revisione indipendente conclusa senza rilievi importanti, limiti del parser documentati: controllo mirato su import dei framework inclusi, non emulazione completa di dyld.
- Prova candidata run42435537614 sullo stesso commit, in coda/in avvio dopo baseline. Leggere esito, screenshot e log prima di integrare/ricompilare per TestFlight. Nessun nuovo IPA o upload corretto ancora prodotto.

## Difetto di linkage nativo individuato e candidato in verifica (8 novembre 2026)

- Audit dell'IPA1201:1605import obbligatori fra10immagini Mach-O; uno non risolto. ExpoModulesCore.framework richiede _OBJC_CLASS_$_RCTStatusBarAppearance da React.framework, ma React non lo esporta. Test binario della1201 fallisce su questo simbolo; non e solo ipotesi sul JS. Rapporto .ips del telefono ancora assente.
- Core58.0.30 risolto dal lock contiene anche sorgente ExpoRootViewController che usa RCTStatusBarAppearance; il ReactNative0.88.0-rc.3 installato non contiene tale classe. Fungo Italia con le stesse versioni Expo/RN usa Core58.0.11, JSI58.0.7, macros0.14.0 e compila Expo dai sorgenti. Commit Fungo f2484da38a344b390b24e0148f7824a20c7b8818 descrive la correzione di un crash dyld.
- Candidato locale: overrides della famiglia Core/JSI/macros alle versioni compatibili e buildFromSource per tutti i moduli Expo. Tre voci lock copiate esattamente dal lock Fungo con integrity npm; nessuna chiamata Expo API. npm ci --dry-run --offline riuscito,277/277test e TypeScript riusciti localmente. node_modules locale resta della baseline: la nuova compilazione nativa/fresh npm ci devono ancora essere verificati su GitHub.
- Nuovo controllo binario scripts/verify-ios-linkage.py rifiuta il simbolo mancante della1201; collegato prima di artifact-ready/upload in github-ios-native.sh. Test autolinking aggiunto: RED sulla baseline, GREEN dopo configurazione. Revisione indipendente del candidato in corso.
- Diagnosi baseline gia avviata: workflow ios-startup.yml run42434693660, job128590929389, commit0c2597bef6652b563e7479988f8b3576631ab40a; fase compilazione/avvio Release su simulatore in corso. Non duplicare e non dichiarare superato finche log/processo/screenshot non verificati.
- Prossimo passo: salvare candidato in ramo fix/ios-startup-20261108, verificarlo sul simulatore dopo baseline, correggere rilievi; poi build firmata nuova e upload. Non dichiarare il crash sul telefono risolto senza nuovo esito.

Questo checkpoint prevale sulle fasi precedenti della diagnosi.

## Crash reale all'avvio dopo installazione TestFlight (8 novembre 2026)

- Utente conferma email ricevuta, TestFlight aperto, app installata e chiusura immediata all'avvio; screenshot mostra Facciamo Balotta si e bloccato. Non e un blocco di accesso. Build distribuita0.1.0(1201), nessuna correzione ancora dichiarata.
- TestFlight Crash Feedback controllato: No Crash Feedback. Suggerito Condividi sul telefono per inviare il rapporto Apple; nessun rapporto diagnostico effettivo ancora disponibile.
- Scaricato artifact13598174121 e verificato digest ZIP; IPA SHA256 b9aafb90bd1cc0fbfc7984a6cd96508387121b9d80dba316477eac1dfca2e8d1. Bundle main.jsbundle2304549byte presente. Info.plist versione/bundle corretti, minimum16.4; framework Mach-O collegati tutti presenti, target minOS compatibili. Questo non prova che le dipendenze si inizializzino correttamente.
- Preparati workflow ios-startup.yml e scripts/ios-startup-smoke.sh: nessun segreto/firma/upload, compilazione Release per simulatore iPhone disponibile piu vecchio, avvio25secondi con console/registro processi/log/screenshot/crash-reports. YAML/bash validati localmente; prova macOS non ancora avviata. Eventuale iOS del simulatore diverso dal telefono va dichiarato.
- Prossimo passo: avviare diagnosi sul codice invariato, leggere eccezione native/JS e report Apple; correggere solo dopo riscontro. Testi/export/firma e Ready to Test NON provano avvio reale. Non chiamare la1201 funzionante e non inviare altri inviti.

Questo checkpoint prevale sui precedenti esiti di distribuzione: installazione riuscita, avvio fallito sul telefono.

## Invito personale TestFlight inviato e verificato (8 novembre 2026)

- Utente ha confermato esplicitamente l'invio dell'invito personale. Selezionato esclusivamente il proprietario Apple Gian Franceschini (Account Holder/Admin) nel gruppo interno Balotta demo.
- UI finale:1Tester/1Build; conferma1testerhasbeenadded; stato tester Invited. Build0.1.0(1201) gia Ready to Test. Nessun altro destinatario aggiunto, nessuna distribuzione automatica attivata.
- Screenshot locale verificato: /workspace/scratch/balotta-testflight-invited-1794101114922.jpg. Email effettivamente ricevuta, accettazione e installazione su iPhone non ancora verificate.
- Non reinviare automaticamente l'invito e non aggiungere altri tester senza istruzione. L'indirizzo del destinatario resta nella UI Apple e nella conversazione, senza ripeterlo in documentazione pubblica.

Il checkpoint successivo relativo a0tester e invito ancora da autorizzare e storico e superato.

## TestFlight pronto per i test — conferma Apple (8 novembre 2026)

- UI App Store Connect verificata: Facciamo Balotta0.1.0(1201) Ready to Test, scade fra90giorni. Processing completato; build Apple88914f8f-6002-40f9-94d3-92bd6f56ddcc.
- Creato gruppo interno Balotta demo6d7bcbb1-273c-48ee-9120-47da2d79fc66, distribuzione automatica disattivata; associata build1201. UI finale0Testers/1Build/Ready to Test. Nessuna email/invito inviato. Per installazione personale occorre aggiungere il tester al gruppo; chiedere istruzione esplicita per invio invito, proprietario verificato nell'account Apple.
- Pagina verificata: https://appstoreconnect.apple.com/teams/8f57d241-76f9-4226-a912-f2ef24ac1a92/apps/6832101489/testflight/groups/6d7bcbb1-273c-48ee-9120-47da2d79fc66/builds
- Screenshot locale di conferma: /workspace/scratch/balotta-testflight-ready-1794100901238.jpg. Workflow nativo42432579018 SUCCESS, nessun Expo cloud/API. Segreti cifrati GitHub configurati, copie private temporanee locali eliminate.
- Demo illustrativa: backend/AI/OAuth live restano disabilitati. Play Store non pubblicato, nessun collaudo fisico iPhone/iPad ancora eseguito. Non confondere Ready to Test con pubblicazione App Store o test sul telefono.

Questo stato prevale sulle note cronologiche successive di processing pendente.

## iOS compilata, firmata e caricata ad Apple (8 novembre 2026)

- Run nativo GitHub42432579018 COMPLETED/SUCCESS sul commit a8f04359410d6295dc49128dda8421dacc4c265f. Versione0.1.0, build1201; Xcode26.6/SDK iOS26.5.
- Log verificati: ARCHIVE SUCCEEDED 01:14:04Z; EXPORT SUCCEEDED 01:14:17Z; UPLOAD SUCCEEDED with no errors 01:16:23Z. Controlli codesign di archivio e IPA, bundle e numero build superati nello script. P8 dedicata usata per altool diretto ad Apple, senza API Expo.
- Artifact GitHub13598174121, balotta-ios-2-1, ZIP43630476byte; digest ZIP e8fc9abbc27bd6937817eea097d3bfd822fc0706c2facd4780831a40c6a1bbc6, scadenza2026-11-15T01:16:24Z. Include IPA firmata e SHA256SUMS; digest ZIP non e il digest della sola IPA.
- TestFlight6832101489 controllato immediatamente dopo upload: ancora No Builds; elaborazione Apple e disponibilita ai tester non ancora confermate. Nessun gruppo/tester/invito creato. Prossimo passo: aggiornare TestFlight e verificare stato effettivo build1201.
- Quattro segreti di firma verificati GitHub. Eliminate le copie temporanee locali della chiave RSA privata, P12, password, Base64 e P8 scaricata; restano nei segreti cifrati autorizzati. Certificato/profilo pubblici locali conservati per verifiche. Non cercare di riscaricare la P8: Apple la offre una sola volta.
- La demo resta illustrativa con servizi live disabilitati. Questo risultato non e pubblicazione App Store ne collaudo su telefono. Android APK gia disponibile, Play Store ancora non pubblicato.

Le sezioni successive sono storiche e superate dove indicano build/upload ancora in corso.

## Secondo run iOS: importazione superata, Xcode in corso (8 novembre 2026)

- Run42432579018 sul commit a8f04359410d6295dc49128dda8421dacc4c265f, build prevista1201. Credentials128584492591 success; job Mac128584515753 in corso, fase Archive/sign/upload. Generazione iOS e CocoaPods success; log Xcode di compilazione dell'archivio osservato, quindi import e controllo identita del certificato superati.
- Quattro segreti GitHub verificati presenti. CI controlli/export sul commit corretto run42432502499 success. IPA, upload e processing non ancora verificati.
- Continuare da questo run senza avviare duplicati. La conversione P12 temporanea ha superato il punto di errore precedente.

## Correzione importazione P12 sul Mac GitHub (8 novembre 2026)

- Primo run nativo42432157443 fallito prima di Xcode: security SecKeychainItemImport MAC verification failed durante import P12. npm ci/test/typecheck/prebuild e CocoaPods tutti success. Nessun IPA o invio Apple.
- P12 originale/password verificati localmente: validi, formato OpenSSL3 PBES2/AES256 e MAC SHA256. Riferimento Apple DTS: https://developer.apple.com/forums/thread/723242 documenta incompatibilita dei formati moderni con Security.framework.
- Script ora converte soltanto nel RUNNER_TEMP privato il P12 in contenitore compatibile SHA1/3DES; originale forte resta nel segreto GitHub. PEM intermedio eliminato subito, contenitore rimosso dopo import e trap elimina ogni residuo. Nessun nuovo certificato/chiave o cambio permessi.
- bash -n e conversione crittografica locale superati, certificato SHA1 invariato, password errata rifiutata. Import effettivo macOS ancora da verificare nel nuovo workflow sul nuovo commit; non rilanciare il vecchio SHA.


## Firma Apple dedicata autorizzata e configurata (8 novembre 2026)

- Utente ha confermato esplicitamente creazione di nuovo certificato Apple Distribution e chiave Balotta GitHub e conservazione nei segreti cifrati di questo repository.
- Creata Team API key Balotta GitHub, ID pubblico SHK6U3T299, ruolo Developer. Creata Distribution R2YAMH7B2W, seriale77932D3F53E8F562CC66B7D28A7995DD, SHA1 9572CC36BA5BBB5A1969E17A35E8B2614BD5B6E1; verificata corrispondenza con nuova chiave privata, fuori da Git.
- Creato profilo Balotta GitHub App Store, portalID L2R5BNK34M, UUID a521e473-151f-453b-ae35-738e30a8c7f0, scadenza 2027-11-08T00:38:00Z. Decodificato e verificato team/bundle, production push, Apple sign-in Default, get-task-allow=false e unico certificato nuovo corrispondente.
- Tutti i quattro segreti P8, P12, password e profilo verificati nell'elenco GitHub. Nessun segreto nel repository, nei log o negli artifact. Nessuna revoca/modifica delle credenziali delle altre app.
- Script aggiornato all'ID pubblico SHK6U3T299, bash -n superato. Workflow manuale ios-native.yml avviato su main/c18c0a3ef335489320a89f9186c7ead28bc94339: run42432157443, build prevista1101. Job credentials128583217485 success; job Mac128583234166 in corso. CI controlli/export dello stesso commit run42431922302 success. Prossimo passo: verificare archive/IPA/upload/processing Apple separatamente; nessun IPA o upload ancora verificato.

Il checkpoint precedente e le indicazioni di credenziali non create sono storici e superati.

## Checkpoint precedente — main integrato e CI verde (8 novembre 2026)

- Repository pubblica. PR #1 integrata in main: commit 9c2388b0fa3a399b0a650a7d8c8e00c95bc674b7, albero 38ae6a8e3cca97ec7472b7d5df9a8420ac807db0 identico al codice revisionato e verificato.
- GitHub Actions run 42426621708 su quel commit: completed / success. Sono controlli ed export, non una compilazione Xcode o un upload TestFlight.
- Workflow iOS nativo ora presente in main. Segreti GitHub ancora assenti; nessun job nativo avviato, nessun IPA e nessun upload Apple.
- Preparati nel browser i moduli per un nuovo certificato Apple Distribution e una nuova Team API key chiamata Balotta GitHub, ruolo Developer. NON premuto Generate e nessuna nuova credenziale emessa. Il ruolo Developer della Team key vale per il team Apple, non solo per Balotta; salvarla soltanto nei segreti cifrati di gianpaolobol/facciamo_balotta richiede conferma specifica prima della creazione/trasmissione.
- Prossima azione dopo conferma specifica: CSR/nuovo certificato e profilo App Store corrispondente; chiave P8; segreti GitHub; adattare l'ID pubblico della chiave nel workflow/script (attualmente Q867WLD8JD), quindi workflow manuale e verifica processing TestFlight. Nessuna revoca dei certificati/chiavi delle altre app.
- La richiesta di conferma riguarda nuovo accesso persistente Apple e custodia in GitHub, non autorizzazioni di rete. Nessun recupero di chiavi tramite API Expo negata.

Le sezioni seguenti conservano la cronologia; questo checkpoint prevale sulle vecchie indicazioni main invariato, CI bloccata e workflow solo nel ramo.

## Pubblicazione repository richiesta — 8 novembre 2026

- Visibilità GitHub cambiata da private a public su richiesta esplicita dell’utente, verificata nella UI e nei metadati GitHub. Controllati207file testuali del ramo e18versioni testuali differenti di main: nessuna credenziale reale nei pattern cercati, nessun file chiave/database/envprivato tracciato; unico match PEM e stringa di validazione nel codice, non chiave. Non e una certificazione completa di tutta la cronologia.
- Ripetuti npm test276/276, Worker11/11 e TypeScript exit0 sul codice corrente. PR #1 successivamente integrata in main; vedere checkpoint prevalente.
- I segreti di firma GitHub restano assenti. Nessuna nuova credenziale creata o trasferita e nessuna build iOS avviata.

## Aggiornamento prevalente — iOS nativo su GitHub (8 novembre 2026)

- L’utente propone compilazione diretta da GitHub. Preparati .github/workflows/ios-native.yml e scripts/github-ios-native.sh: Expo prebuild offline, CocoaPods/Xcode sul Mac GitHub, firma locale e upload altool diretto ad Apple. Nessun EAS CLI/token/API Expo; non e un inoltro del comando negato. Leggere docs/GITHUB_NATIVE_IOS.md.
- Prebuild iOS offline riuscito; YAML/shell/Python e firma configurata sul vero progetto generato verificati localmente. Revisione indipendente completata con un difetto artifact corretto; nessun rilievo importante residuo. Compilazione Xcode/firma/upload non eseguiti su host Linux.
- GitHub Settings di Balotta verificato: repository e ambienti senza segreti. Servono P12, password, profilo Balotta e P8 nei segreti GitHub; nessuna credenziale privata letta/trasferita o creata. Repository pubblica con runner standard; workflow ora integrato nel default branch, senza modificare piani o budget. Nessun job nativo GitHub avviato, nessun IPA o TestFlight nuovo.
- Vincolo: niente accesso generale alla rete e nessun aggiramento del diniego API Expo. Android demo gia completata; la nuova strada compila con Xcode, senza contattare Expo per credenziali o build.

## Stato corrente — beta funzionale completata nel codice (7 novembre 2026)
Questa sezione prevale su tutte le priorità storiche successive. Leggere docs/APP_STATUS_2026-11-07.md. Non ricominciare recuperi o funzioni già implementate.
- Ramo feat/illustrated-profile-draft-20261107, PR #1: UI live, preferenze/matching, profilo illustrato approvato, appuntamenti, gruppi, chat, blocchi/segnalazioni/moderazione e notifiche interne integrati. Demo/font/asset preservati.
- Verifiche finali locali correnti:276/276 test generali;11/11 Worker compilato/Miniflare-D1; TypeScript ed export web/iOS/Android exit0. Revisione indipendente con due regressioni corrette RED→GREEN (scadenza sessione durante invii, coda con notifiche invisibili). Browser mobile con due account sintetici superato, inclusi approvazioni, chat, revisioni e inbox. Nessun provider reale o telefono collaudato.
- GitHub Actions sul codice5681326: run42404274263/job128498490018 termina failure in2secondi con steps vuoto, prima dei comandi. Annotazioni lette nel browser GitHub: restrizione amministrativa di Billing & plans (pagamenti recenti non riusciti oppure limite di spesa). Non è stato modificato alcun piano/budget; non dichiarare CI verde.
- Inviti aggiornati alla richiesta rubrica/solo nomi: lettura autorizzata iOS/Android, canali personali WhatsApp/SMS/email, selezione multipla/tutti e composer individuali con conferma utente. Nessun recapito mostrato nel pannello o caricato al server. Nota12px: il profilo non viene incluso, ma il mittente personale resta visibile. Non chiamare questi inviti anonimi. EXPO_PUBLIC_INVITATION_URL ancora vuoto: apertura live disabilitata finché link ufficiale/build non disponibili. Nessuna rubrica reale o composer collaudato;276/276 test,11/11 Worker, typecheck/export tutte piattaforme e browser mobile superati. Leggere docs/INVITATIONS.md; il precedente adapter server resta separato/spento.
- Distribuzione: creato e verificato progetto Expo dedicato @gianpaolobol/facciamo-balotta (ba138648-4f96-4571-b34c-567388ca51b8), collegato in config/distribution.mjs; icone native originali e archivio EAS allowlist verificato102file/104totali senza env/export/chiavi. Nuove verifiche276test/typecheck/export tutte piattaforme exit0. Ora APK demo prodotto; nessun AAB o IPA ancora verificato. Upload/job Android riusciti (vedere voce build demo). Play account studio micologia accessibile, modulo Creaapp precompilato ma due dichiarazioni legali NON accettate e record NON creato. Apple autenticato: registrato App ID it.facciamobalotta.app con Sign in with Apple e Push; creata e verificata scheda App Store Connect6832101489, TestFlight ancora No Builds. Leggere docs/DISTRIBUTION_2026-11-07.md.
- Build demo richieste: profilo EAS demo, APK Android internal/medium e iOS store/medium; ambiente demo verificato senza variabili account/progetto, nessun .env locale o API/link inviti in shell. Quota Starter letta:600/4500crediti, overage corrente0centesimi. Android demo0.1.0(2) FINISHED, job24804f14-58e7-40a6-9baa-3b7700035d46; APK scaricato106281973byte, SHA256d4312d8a5d85e8a40ad94a44a106871a6ec3af4454196f995d3cdd9c6c3d0eb4. Profilo Apple Facciamo Balotta App Store generato, UUID351c91f1-b239-413e-9e06-1c89618b765b, scadenza2027-10-09; seriale certificato account già in Expo verificato contro il profilo, nessuna nuova chiave privata/API. Config iOS Expo salvata e UI Valid per certificato/profilo. Primo tentativo iOS privo di firma fallito, secondo annullato prima della password; nuovo tentativo non interattivo con buildNumber3 interrotto da policy: Network access to https://api.expo.dev:443 was blocked by policy. Nessun jobID/IPA iOS verificato; non aggirare il diniego tramite browser/runner/proxy. Android resta FINISHED. Invio iOS: iniziale rifiuto auto-review sul riuso risolto dall’autorizzazione esplicita utente «ti autorizzo a riutilizzare la chiave fungo Italia». Selezionata la Team API key salvata fungoitalia, ID pubblico Q867WLD8JD, e salvata nella configurazione EAS iOS di Balotta; UI finale mostra la chiave associata. Nessun segreto privato letto/scaricato, nessuna chiave nuova o ampliamento dei permessi. Rimane soltanto il diniego di rete API Expo per la compilazione; non aggirarlo. ascAppId6832101489 e teamBX9MDXAHKG verificati nel browser. Google Auth Platform mostra Site Unavailable, nessuna credenziale Google/Meta creata.
- Tutti i flag sociali/OAuth/Apple/AI restano disabilitati per default; check:release ready=false. Nessun deploy, nuova chiave/spesa, build firmata o merge in main. Anteprima precedente invariata.
- Prossimo passo: attivazione in un ambiente normalmente autorizzato, configurazione account/callback/secret/schede store (progetto Expo ora collegato), vere generazioni AI e firme/prove fisiche. Diniego di rete Cloudflare invariato: non aggirarlo.
- Incremento push native predisposto: consenso esplicito, token cifrati, prova di installazione, revoca con sessione, quote SQL e ricevute Expo; PUSH_ENABLED=false, nessun cron/invio reale. Leggere docs/NATIVE_PUSH.md. APNs/FCM/EAS e prova telefoni non configurati. Informative/termini definitivi e monitoraggio quote restano prerequisiti di pubblicazione.

- Ultimo tentativo di autorizzazione ufficiale: richiesta di esecuzione elevata per build iOS + auto-submit rifiutata prima di eseguire il comando; policy Granular con sandbox_approval=false e request_permissions=false. Nessuna nuova build/versione/upload avviata. Non chiedere altre chiavi o ripetere consenso: occorre modifica autorizzata della policy di rete/esecuzione dell’ambiente.

Aggiornato l’8 novembre 2026 (Europe/Rome).
Repository pubblica canonica: https://github.com/gianpaolobol/facciamo_balotta

## Priorità attuale — debug delle interruzioni (7 novembre 2026)
Questo aggiornamento prevale sulla coda storica di recupero riportata sotto.
- Leggere docs/DEBUG_INTERRUZIONI_2026-11-07.md: causa del crash ChatGPT NON accertata; nessun accesso ai log del client iOS o interni ChatGPT.
- Ripetuti nella copia selettiva verificata /workspace/scratch/52db29df5fbb/balotta-runtime-verificato: 40/40 test, typecheck ed export web/iOS/Android, tutti exit 0. Dipendenze esistenti riutilizzate tramite symlink; npm ci non ripetuto. Non sono build native o un checkout integrale dell'archivio.
- L'app richiama 39 asset JPEG/TTF, nessun PNG; hash locali coincidenti con le rispettive voci del manifest di trasferimento remoto. I 28 PNG mancanti riguardano l'archivio originali, non l'esecuzione della demo.
- Non ricominciare il recupero degli originali come prerequisito dello sviluppo. L'utente ha già chiesto di smettere di cercarli e ricreare: conservare la provenienza e lavorare su massimo due immagini per blocco quando richiesto.
- Le ricodifiche PNG da JPEG della sessione precedente sono solo locali: non dichiararle originali recuperati o file salvati su GitHub.
- Verifica successiva completata: copia selettiva con 99 file identici ai blob dell'albero GitHub 25664a1d939a7efbe60a62cde3bfbd102fa898c5, inclusi tutti i 35 file applicativi/test/configurazione richiesti e i 39 asset runtime. Nessun asset runtime mancante. Dettagli: docs/VERIFICA_RUNTIME_2026-11-07.json. Il recupero integrale 55/83 resta incompleto e distinto. Prossima azione: sviluppo approvato, senza ripetere il recupero archivistico.
- Screenshot ricevuto: APICore.ConversationDetailError.DetailError 1. Successivamente l'utente riferisce la chat aperta in Chrome. Usare Chrome per proseguire; non è dimostrata la causa sottostante né una risoluzione permanente. Non ripetere la richiesta dello screenshot già ricevuto.

## Stato verificato (storico)
- La repository contiene codice testuale e docs/RECUPERO_2026-11-06.md, riletto dal remoto in questa sessione.
- Il recupero integrale NON è completato: il checkpoint remoto dichiara immagini e font ancora da trasferire. Il dato size=0 dei metadati GitHub non prova che la repository sia vuota.
- Sorgente locale recuperabile: /workspace/sites/facciamo-balotta, commit 21d9f2d, con modifiche locali al README/.gitignore e originali PNG non tracciati. Non sovrascrivere.
- Copia preparata: /workspace/scratch/03ef64d36ba1/facciamo_balotta. Non è un checkout Git.
- Inventario locale assets: 83 file, 163212520 byte, incluse illustrazioni e font. docs/ASSET_MANIFEST_2026-11-06.json contiene percorsi, dimensioni e SHA-256; non certifica la presenza remota.
- 40 test e TypeScript risultavano superati nella precedente ripresa; non rieseguiti in questa sessione dedicata alla continuità.
- Nessuna diagnosi tecnica del crash ChatGPT: non attribuirlo con certezza alla lunghezza della chat o al trasferimento.

## Coda ordinata
1. Completare il trasferimento di immagini e font nella repository privata, conservando gli originali. Verificare hash e checkout completo prima di dichiararlo concluso.
2. Installare dal checkout remoto completo, eseguire test, typecheck ed export; registrare commit e risultati. Gli export non sono build native firmate.
3. Riprendere la richiesta già approvata: profilo da descrizione, ritratto e fino a cinque immagini degli interessi; conferma e rigenerazione singola. Matching per interessi/intenzioni/disponibilità, senza valutazione estetica.
4. OAuth reale/backend HTTPS e build native restano da configurare; consultare il recupero per i dettagli.

## Regola di lavoro per ogni sessione
- Leggere AGENTS.md, questo file e docs/RECUPERO_2026-11-06.md.
- Confrontare i documenti con file, branch e commit effettivi. La chat è un'interfaccia, non l'unico archivio del lavoro.
- Procedere per blocchi piccoli e coerenti. Dopo ciascun blocco aggiornare questo stato con fatti, decisioni, verifiche, impedimenti e prossima azione concreta.
- Salvare il blocco su GitHub e rileggere il file remoto o verificare il commit remoto prima di dire “salvato”.
- Se il salvataggio fallisce indicare esattamente cosa è solo locale. Non segnare una richiesta come eseguita sulla base di un'intenzione.
- Non inserire chiavi, file .env privati, database, log sensibili o credenziali in Git. Conservare .env.example senza segreti.
- Evitare di riversare in chat immagini in base64, log integrali e interi file; usare riepiloghi e riferimenti ai file.
- Queste sono istruzioni per il lavoro durante una sessione; non costituiscono un servizio automatico di backup o un processo attivo a chat chiusa.

## Ripresa in una nuova chat
Apri la repository privata gianpaolobol/facciamo_balotta. Leggi AGENTS.md, CONTINUITA.md e docs/RECUPERO_2026-11-06.md. Verifica lo stato remoto effettivo e riprendi dal primo punto aperto della coda. Non ricominciare da zero, non dichiarare il trasferimento completo finché immagini e font non sono verificati e conserva le modifiche locali già presenti.

## Avanzamento caricamento per lotti
55/83 file asset salvati su main. Hash Git confrontati con gli originali locali e albero remoto riletto dopo ogni lotto. Elenco verificabile e file pendenti: docs/TRASFERIMENTO_ASSET.json.
Trasferimento e verifica checkout completo ancora aperti. Proseguire dai 28 file pending senza ricaricare quelli verificati. Nessun originale modificato.

## Ripresa del 7 novembre 2026 — lotto di 6 originali
- Letti AGENTS.md, CONTINUITA.md, recupero e inventari remoti; main iniziale e00a47c82f057ded061ae1de601a4c0447bccd60.
- I vecchi percorsi locali non sono presenti nel nuovo ambiente. Recuperata dal repository sorgente dell’anteprima una copia al commit 21d9f2d in /workspace/scratch/d3626e7704d9/source-recovery; questo percorso è temporaneo e non è il checkout GitHub canonico.
- Trasferiti alphabet-source.png, lettering-specimen.png e i quattro originali fotografia-fumetti, musica-colli, spiaggia-complicita, tavolate-giochi. Dimensioni e SHA-256 confrontati con l’inventario originario, SHA Git dei blob identici ai byte locali.
- La copia sorgente recuperata contiene tutti i JPEG e il font usati dalla demo, ma non i 31 originali PNG assets/events ancora pendenti. Cercarli tra le immagini originali salvate, verificando SHA-256 e dimensioni prima del trasferimento; non sostituirli con JPEG convertiti o immagini rigenerate.
- Nessun codice applicativo modificato; test, typecheck ed export non rieseguiti in questo lotto. Checkout remoto completo e recupero integrale restano aperti.
- Prossima azione: recuperare i 31 PNG elencati in docs/TRASFERIMENTO_ASSET.json, poi completare verifica checkout e controlli applicativi.

## Ripresa del 7 novembre 2026 — lotto di 3 originali
- Verificato main al commit 577c18b12b6444157b2ad0ce6c7bd85ff1fce614; letti AGENTS.md, continuità, recupero e inventari.
- Recuperati dagli originali salvati chess.png, concert.png e cooking.png. Dimensioni e SHA-256 identici al manifest iniziale; SHA Git dei tre blob confrontati con i byte locali.
- Stato: 55/83 asset trasferiti, 28 PNG ancora pendenti. I vecchi percorsi di scratch non esistono in questo ambiente; tre originali materializzati in /workspace/scratch/cd1199ef16ff/originals.
- Nessuna modifica al codice; test, typecheck, export e checkout integrale non eseguiti in questo lotto.
- Prossima azione: recuperare i 28 PNG ancora elencati in docs/TRASFERIMENTO_ASSET.json, mantenendo lotti piccoli e verifica degli hash, poi verificare checkout e applicazione.

## Recupero originali ripreso da Chrome — lotto 1
- Ritrovati localmente tutti i 28 originali mancanti, SHA-256 identici al manifest originario.
- Primo lotto: cinema.png e climbing.png, byte originali senza conversione.
- Inventario: 57/83 asset; 26 ancora da collegare a main.
- Gli oggetti binari del primo lotto risultavano già disponibili su GitHub: riutilizzati gli SHA originali, evitando un nuovo trasferimento in base64.
- Coda: completare i restanti originali a due per commit e verificare ogni albero remoto.

## Recupero originali — 59/83
- Lotto: community.png, crafts.png. SHA-256 locali identici al manifest originario; blob Git originali riutilizzati senza ricodifica.
- Stato: 59/83; pendenti 24. Verificare l'albero remoto dopo il commit prima del lotto successivo.

## Recupero originali — 61/83
- Lotto: dance.png, football.png. Byte originali, SHA-256 locali identici al manifest originario e SHA blob restituiti da GitHub coincidenti.
- Stato: 61/83, pendenti 22. Nessun JPEG o codice applicativo modificato.

## Recupero originali — 62/83
- Recuperato gardening.png: dimensione e SHA-256 identici al manifest iniziale; SHA Git calcolato sui byte originali.
- Recuperato anche pottery.png localmente e verificato SHA-256, ma il blob non è disponibile su GitHub. Il tentativo di includerlo nell'albero è fallito (422); NON è salvato sul remoto e resta pending.
- Stato inventario: 62/83; 21 originali pendenti. Nessuna modifica al codice.
- Screenshot IMG_0522.jpeg: Unknown error anche su Chrome iPhone; causa non accertata. URL della chat non disponibile dalle fonti accessibili.
- Prossima azione: trasferire il blob originale pottery.png e verificare il salvataggio prima di altre immagini.

## Recupero originali — 63/83, trasferimento ceramica completato
- Trasferiti i byte originali di pottery.png: SHA Git restituito da GitHub 7b1a8beb73e1d3db4c82b34f270de0f5a070d14f, identico al calcolo locale. SHA-256 già verificato contro il manifest iniziale.
- Risolto l'impedimento del blocco precedente; nessuna ricodifica. Inventario 63/83, 20 originali pendenti.
- Nessuna modifica al codice o nuova esecuzione dei test. Proseguire con i restanti originali a coppie.

## Recupero originali — 65/83
- Aggiunti kayaking.png e motorcycling.png: dimensioni e SHA-256 identici al manifest iniziale, SHA Git calcolati sui byte originali e verificati con gli oggetti GitHub.
- Il titolo salvato «Sosta tra amici sull’Appennino.png» corrisponde per hash a motorcycling.png, non a hiking.png: mantenuta la mappatura del manifest senza dedurla dal titolo.
- Inventario: 65/83; 18 originali pendenti. Codice applicativo invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: proseguire con massimo due originali per blocco e verifica remota. Il crash ChatGPT resta senza causa accertata.

## Recupero originali — 67/83
- Aggiunti languages.png e makers.png dagli originali salvati: dimensioni e SHA-256 identici al manifest iniziale. Blob GitHub caricati e SHA Git restituiti identici al calcolo sui byte locali; nessuna ricodifica.
- Inventario: 67/83; 16 originali pendenti. Codice applicativo invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: continuare con massimo due originali per blocco, verificando il commit remoto prima del successivo. Il crash ChatGPT resta senza causa accertata.

## Recupero originali — 69/83
- Aggiunti pets.png e skating.png dagli originali salvati: dimensioni e SHA-256 identici al manifest iniziale; SHA Git verificati con GitHub, nessuna ricodifica.
- Inventario: 69/83; 14 originali pendenti. Codice applicativo invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: proseguire con massimo due originali per blocco e verifica remota. Causa del crash ChatGPT non accertata.

## Recupero originali — 71/83
- Aggiunti yoga.png e wine.png: byte originali locali con SHA-256 identici al manifest iniziale; nessuna ricodifica.
- Inventario: 71/83; 12 originali pendenti. Codice applicativo invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: proseguire con massimo due originali per blocco e verifica remota. Causa del crash ChatGPT non accertata.

## Recupero originali — 73/83
- Trasferiti hiking.png e padel.png: dimensioni e SHA-256 locali identici al manifest iniziale; SHA dei blob restituiti da GitHub identici al calcolo sui byte originali. Nessuna ricodifica.
- Risolto il precedente errore 422 caricando i due blob originali prima della creazione dell'albero.
- Inventario: 73/83; 10 originali pendenti. Codice applicativo invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: proseguire con massimo due originali per blocco e verifica remota. Causa del crash ChatGPT non accertata.

## Recupero originali — 75/83
- Aggiunti photography.png e videogames.png dagli originali salvati: dimensioni e SHA-256 identici al manifest iniziale; SHA Git restituiti da GitHub identici al calcolo locale. Nessuna ricodifica.
- Inventario: 75/83, 8 originali pendenti. Codice applicativo invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: proseguire con massimo due originali per blocco e verifica remota. Causa del crash ChatGPT non accertata.

## Recupero originali — 76/83
- Aggiunto volleyball.png dall’originale salvato Beach volley sulla costa romagnola.png: 3228690 byte e SHA-256 2245a8e45a8499ded12e3c4f51f04cda3b151f3dd0a278b908cd0db741cf5b95 identici al manifest iniziale; SHA Git restituito identico al calcolo locale. Nessuna ricodifica.
- Inventario: 76/83, 7 originali pendenti. Codice invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: continuare con massimo due originali per blocco e verifica remota. Causa del crash ChatGPT non accertata.

## Recupero originali — 78/83
- Aggiunti painting.png e reading.png: dimensioni e SHA-256 locali identici al manifest iniziale; SHA Git calcolati sui byte originali. Nessuna ricodifica.
- Inventario: 78/83, 5 originali pendenti. Codice invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: running.png e tennis.png, massimo due originali per blocco e verifica remota. Causa del crash ChatGPT non accertata.

## Sviluppo profilo illustrato — bozza isolata del 7 novembre 2026
- Ramo di lavoro: feat/illustrated-profile-draft-20261107. Questa sezione descrive soltanto tale ramo; main e demo non sono stati modificati.
- Aggiunti src/illustrated-profile.mjs e tests/illustrated-profile.test.mjs: descrizione facoltativa del ritratto, massimo cinque descrizioni di interessi distinte, conferma del testo per slot e revisione che invalida soltanto la conferma della descrizione modificata.
- Non sono immagini generate: nessun provider AI, richiesta a pagamento, chiave, persistenza o collegamento UI è stato aggiunto. Conferma del testo e approvazione dell'immagine futura sono concetti separati.
- Verifica locale Node 24.22.1: cinque test nuovi superati. npm test sulla copia testuale selettiva: 38 pass, 4 fail per materiale locale non disponibile: art-catalog (JPEG assenti), lettering (fontkit assente), phone-demo (fixtures.ts non materializzato), profile-scope (React assente). Non è una prova di regressioni né una suite completamente superata.
- Nessun typecheck, export o collaudo nativo eseguito in questo blocco. Il ramo è una bozza, non pronto per merge.
- Prossima azione: completare il checkout eseguibile e le dipendenze, verificare l'intera suite, poi integrare le descrizioni e conferme nella schermata Profile. Il provider AI richiede un passaggio separato e configurazione sicura.

## Sviluppo profilo illustrato — modulo collegato alla schermata, 7 novembre 2026
- Ramo: feat/illustrated-profile-draft-20261107. Aggiunti hook e componente; Profile ora espone una sezione richiudibile con ritratto facoltativo e cinque interessi, massimo 1000 caratteri per campo.
- Conferme del testo indipendenti, invalidate alla modifica del solo campo interessato. Identità fisse degli slot anche dopo cancellazione; duplicati normalizzati rifiutati, senza bloccare campi indipendenti. Errori accanto al campo e accessibilityHint.
- Bozza soltanto in memoria; esclusa dal PUT del profilo. Nessuna persistenza, generazione AI, immagine approvata o rigenerazione implementata. Avviso visibile; demo invita a usare descrizioni inventate.
- Ricostruita copia eseguibile selettiva dal ramo: sorgenti/configurazioni/test e tutti i 39 JPEG/TTF runtime con SHA Git verificati. Archivio PNG escluso da questa verifica, recupero integrale ancora distinto.
- npm ci --ignore-scripts --no-audit --no-fund: 522 pacchetti installati da lockfile. npm test: 54/54, exit 0. npm run typecheck: exit 0. CI=1 npm run export:all: exit 0, bundle web, Android e iOS prodotti. Sono export, non build firmate o test su dispositivi.
- Revisione indipendente eseguita: due rilievi corretti (duplicati estranei bloccanti; errori lontani dal campo), entrambi riprodotti con test falliti e poi superati. Nessun rilievo importante noto lasciato aperto su questo blocco.
- Controllo visivo non completato: Playwright privo di browser, installazione fallita per archivio scaricato non valido. I test del renderer coprono il comportamento del hook, non layout o interazioni native.
- main e anteprima pubblicata non aggiornati. Prima del merge: controllo visivo e integrazione UI/sessioni. Poi persistenza autenticata della bozza e collegamento AI server con credenziali sicure, approvazione delle immagini e rigenerazione singola.

## Sviluppo profilo illustrato — persistenza autenticata e QA web, 7 novembre 2026
- Ramo e PR: feat/illustrated-profile-draft-20261107, PR #1. Nessun merge o aggiornamento dell'anteprima pubblicata eseguito.
- GET/PUT /api/illustrated-profile usa la sessione esistente. Nuova tabella SQLite illustrated_profiles con FK utente e cancellazione a cascata. Scritture condizionate alla versione attesa; una seconda sessione non può sovrascrivere silenziosamente una bozza più recente (409).
- La schermata carica testi/conferme salvati e offre Salva la bozza illustrata. Modifiche disabilitate durante caricamento/salvataggio; errori di rete conservano le modifiche, ricaricamento richiede una seconda conferma quando scarterebbe testi locali. Salvataggio separato dal profilo base. In demo nessun caricamento/salvataggio delle descrizioni.
- Validazione condivisa di sei slot, 1000 caratteri ciascuno, conferme coerenti con il testo; duplicati NFKC/minuscolo vietati tra interessi confermati. Bozze incomplete possono contenere duplicati non confermati.
- Revisione indipendente: corretti due rilievi con test RED-GREEN, limite del payload JSON e duplicati confermati. Verificato e adeguato anche il limite di byte dell'adapter HTTP: 80000 soltanto per PUT /api/illustrated-profile, 16384 sulle altre route. Configurazione reverse proxy documentata in BETA_SETUP.md.
- npm test: 73/73, exit 0. npm run typecheck: exit 0. Export finale da sorgenti correnti con CI=1 npx expo export --platform all --output-dir dist-verify --max-workers 2: exit 0, tre bundle e metadati presenti. Non sono build native firmate.
- Sbloccata la QA web usando Chromium ottenuto da un pacchetto runtime temporaneo (nessuna dipendenza di prodotto aggiunta). Verifica su frontend esportato con API locale reale, SQLite e sessione sintetica; non OAuth reale.
- Browser: superati salvataggio e ricaricamento pagina, ripristino conferme, modifica indipendente, conflitto e preservazione modifiche, ricarica in due passaggi, payload del profilo base separato, errore vicino al campo, reset entrando in demo e assenza di chiamate all'API delle descrizioni in demo. Nessuno scorrimento orizzontale a 390x844 e 1280x900; screenshot ispezionati per QA interna, non pubblicati.
- Regresioni: risposte di caricamento o salvataggio tardive di un account smontato non contaminano il nuovo account. Prove su telefoni fisici e build native ancora da eseguire.
- Prossima azione: integrazione con main dopo confronto con i suoi aggiornamenti, quindi generazione server con provider/credenziali sicuri, risultati versionati, approvazione delle immagini e rigenerazione singola. Nessun provider, chiave API, addebito o generazione personale attivato in questo blocco.

## Generazione AI gratuita — integrazione pronta, attivazione ancora bloccata (7 novembre 2026)
- Scelta su richiesta esplicita dell'utente: Cloudflare Workers AI, modello fisso FLUX.2 Klein4B, per quota gratuita e supporto a immagini di riferimento. Font Balotta Inchiostro invariato; due riferimenti JPEG del progetto ridotti a 448x252 in assets/ai-reference (provenienza nel manifest).
- Implementati adapter multipart server, API private per singolo slot, anteprima/approvazione/scarto/rigenerazione, immagini in SQLite e controlli su sessione, conferma del testo/versione e maggiore età. L'immagine approvata resta conservata durante una rigenerazione fallita.
- Budget persistente e atomico: 50 tentativi complessivi al giorno e 12 per utente, inclusi i fallimenti; account cancellato non azzera il consumo globale. Nessun retry automatico e nessun fallback a pagamento.
- Il provider resta disabilitato senza account/token e CLOUDFLARE_FREE_PLAN_CONFIRMED=true. Tale flag è una dichiarazione dell'operatore, NON una verifica automatica del piano del fornitore: controllare Workers Free sull'account esatto prima di abilitarlo, senza Paid o AI Gateway credits. Non dichiarare gratuità garantita su account Paid.
- Controllo sicuro dell'ambiente: assenti account ID e token Cloudflare. Nessun segreto creato, registrato o pubblicato, nessuna chiamata reale al provider e nessun addebito. Browser Cloudflare fermo sulla pagina di accesso https://dash.cloudflare.com/login, non autenticato.
- Verifiche: 87/87 test, typecheck exit0, export web/iOS/Android in dist-ai-final exit0. Sono export, non build native firmate. Adapter verificato con risposte controllate, non contro API autenticata reale.
- Revisione indipendente: corretti due difetti UI (chiusura durante generazione bloccava il form; prima anteprima non scartabile), riprodotti in browser prima della correzione e poi superati. Lo script scripts/check-profile-images-web.mjs ripete la prova con sessione sintetica e fixture pixel, mai un'immagine generata reale.
- Font esistente e direzione grafica preservati; identità del risultato artistico di un modello diverso NON dimostrata. Riferimenti e prompt sono predisposti, ma occorrono due generazioni reali dopo l'attivazione per valutare somiglianza e qualità. Non usare imagegen/altro provider per simulare una prova Cloudflare.
- Prossimo passaggio concreto: accesso sicuro Cloudflare, verifica Workers Free, collegamento del token al solo server e prova di due immagini. Se l'autenticazione richiede l'utente, completare prima tutto il lavoro autorizzato e chiedere soltanto quel passaggio. Non chiedere chiavi o password in chat.
- Ramo/PR #1 conservati; nessun merge in main o aggiornamento dell'anteprima pubblicata eseguito.

## Esito accesso Cloudflare — 7 novembre 2026
- Dopo la selezione esplicita del metodo Google e dell'account nel flusso sicuro, la verifica ha riportato alla pagina Cloudflare https://dash.cloudflare.com/login con il messaggio visibile «Unable to sign in. Try again or use your email and password.».
- Accesso Cloudflare NON riuscito. Non è stata accertata la causa; non classificarlo come CAPTCHA, blocco bot o disservizio generale. Nessun tentativo aggiuntivo o cambio di metodo effettuato dopo l'errore generico.
- Nessuna credenziale è stata letta o riportata nella chat/documenti. Nessun token Cloudflare creato o collegato, nessun piano verificato/attivato, nessuna generazione reale o addebito. Provider ancora disabilitato.
- Ripresa: risolvere l'accesso Cloudflare attraverso un nuovo passaggio scelto dall'utente, poi verificare Workers Free e configurare il token solo server. Conservare codice/test già salvati; non dichiarare l'AI attiva o la resa artistica validata.

## Device login approvato ma scambio bloccato dalla rete — 7 novembre 2026
- Profilo TinyFish salvato dall'utente; l'elenco riporta ancora solo Google/GitHub, accesso Cloudflare non verificato. Automazione TinyFish non avviata: servizio a consumo, saldo insufficiente. Nessuna ricarica o nuova automazione a pagamento attivata.
- Avviato Wrangler 4.158.0 login --device --browser=false con soli scope account:read e user:read. L'utente ha confermato «approvato».
- Il recupero del processo ha restituito: Network access to https://dash.cloudflare.com:443 was blocked by policy. Non attribuire questo errore a password errata o mancata autorizzazione dell'utente. Nessuna credenziale OAuth salvata nei percorsi di configurazione standard verificati, senza esporre valori.
- Non ripetere il device login in questo ambiente senza una modifica documentata delle possibilità di accesso alla rete. Non aggirare la policy con proxy o percorsi alternativi. Provider ancora disattivato; nessuna generazione reale e nessuna verifica del piano Free completata.
- Per proseguire serve una connessione autorizzata al provider oppure configurazione sicura del token direttamente nell'ambiente server che eseguirà l'app. GitHub Actions può usarlo come secret ma non elimina il requisito iniziale di accesso Cloudflare. Le credenziali di Fungo Italia non vanno copiate o riutilizzate automaticamente per questo progetto.

## Backend gestito per iOS/Android — adattamento Workers/D1 verificato localmente, 7 novembre 2026
- Utente conferma: Facciamo Balotta deve essere app iOS/Android, senza server dedicato, con repository GitHub. L'utente riferisce di vedere la dashboard Cloudflare nel proprio browser; non equivale ad accesso dell'agente o verifica del piano Free.
- Aggiunti Worker entrypoint, adapter D1 asincrono e migrazione SQL. Le API condivise attendono lo store; Node/SQLite locale resta compatibile. Nessuna modifica alle schermate o alle credenziali di Fungo Italia.
- Workers AI usa il binding env.AI con i due riferimenti binari del progetto. Separato il core della generazione dall'adapter REST Node; bundle Workers senza node:sqlite o accesso al filesystem. Font e modello invariati. AI e OAuth disabilitati per default; ID D1/origin di configurazione sono segnaposto, workers_dev e preview_urls disabilitati.
- D1: versioni ottimistiche, token OAuth/handoff monouso, sessioni native bearer, quote atomiche persistenti e isolamento per utente. Immagini private suddivise in blocchi da 512000 byte; budget transazionale 200 MB per blocchi immagine per restare sotto il limite di 500 MB del singolo database Free. Nessun servizio storage aggiuntivo a pagamento introdotto.
- Revisione indipendente: tre rilievi corretti con regressioni RED-GREEN: precondizioni di versione nelle scritture delle immagini/approvazioni; lettura coerente di metadati e blocchi con un solo snapshot SQL; timeout di 60 secondi per AI binding, senza utilizzare risposte tardive. I fallimenti conservano prenotazioni di consumo e immagine approvata.
- Verifiche sui sorgenti finali: npm test 95/95; npm run test:worker 3/3 (bundle + Worker compilato in Miniflare con D1 locale); migrazione D1 applicata localmente, 16 comandi riusciti; TypeScript exit0; export Expo web/iOS/Android exit0. Include immagine da 2.5 MB, conflitti concorrenti, lettura durante eliminazione e rollback al limite storage. Le immagini AI nel test sono fixture, non risultati Cloudflare reali.
- Dipendenze di sviluppo fissate nel lockfile: Wrangler4.158.0 e Miniflare5.20261104.0-beta, con convertitore ufficiale delle opzioni del runtime. Nessuna dipendenza server importata nel client mobile.
- Nessuna chiamata remota al provider, pubblicazione, DB remoto, chiave creata, nuova spesa, IPA/APK firmata o prova su dispositivo fisico. Non è stata aggirata la policy di rete con proxy, altri runner o GitHub Actions.
- Istruzioni complete: docs/WORKERS_SETUP.md; piano: docs/superpowers/plans/2026-11-07-workers-d1.md. La distribuzione va completata dal gestore in un ambiente normalmente autorizzato a Cloudflare, con piano Free verificato, database/origin/callback/allowlist reali e secret OAuth. Il client dovrà poi avere EXPO_PUBLIC_API_URL HTTPS e build native.
- Ramo/PR #1 restano separati da main e dall'anteprima pubblicata. Prossima azione: configurazione/distribuzione autorizzata, verifica account/provider reale e prove native; Apple login e servizi multiutente di incontri/chat restano ulteriori incrementi.

## Verifiche GitHub del 7 novembre 2026 — backend Workers
- Sul commit 53000433da83f9c20bb5bb9358efc0e550212e74 i run 42391084700 (push) e 42391089176 (pull request) terminano failure prima di eseguire qualsiasi step. L'API restituisce steps vuoto e nessun log disponibile; causa non accertata, nessuna prova di errore del codice o di fatturazione.
- Il workflow ora include npm run test:worker: bundle dry-run e runtime Miniflare/D1 locale con AI sintetica, senza accessi o pubblicazione Cloudflare. Non costituisce un metodo alternativo di distribuzione.
- Confermati separatamente i risultati locali del blocco backend: 95 test generali e 3 test runtime Worker superati, TypeScript ed export Expo completati. Non sono build native firmate né test AI reali.
- Pubblicazione HTTPS, piano gratuito effettivo, OAuth reale, Apple login e collaudo iOS/Android restano aperti. Il diniego di rete verso Cloudflare non è risolto e non va aggirato con runner o proxy.
- Prossimo passo operativo: leggere il messaggio delle annotazioni Actions nell'account GitHub e ripristinare l'esecuzione dei controlli; poi completare il setup in un ambiente normalmente autorizzato ad accedere a Cloudflare. Non attivare piani a pagamento.

## Accesso Apple nativo predisposto e disabilitato — 7 novembre 2026
- Aggiunti expo-apple-authentication compatibile SDK58, plugin e pulsante ufficiale solo iOS disponibile. Nessun pulsante Apple su Android/web. Google/Facebook e demo conservati.
- Backend condiviso Node/Workers: tentativo nonce/state monouso valido cinque minuti e legato al verifier S256 del telefono. Token verificato con WebCrypto RS256 e chiavi dal solo endpoint HTTPS Apple fisso; controlli issuer/audience bundle esatto/nonce/emissione/scadenza/subject/email verificata/allowlist. Identità del client e provider diversi non vengono unite per email. Sessione Balotta in SecureStore.
- APPLE_NATIVE_ENABLED=false per default; bundle previsto it.facciamobalotta.app. Non vengono creati secret o persistiti token Apple. Nessun accesso Apple reale eseguito.
- Verifiche sui sorgenti finali: npm test108/108, test:worker4/4 (include firma RSA sintetica e sessione D1), TypeScript0 ed export web/iOS/Android0. Revisione indipendente senza difetti importanti/critici. Nota minore differita: concorrenza dello scambio Apple nel Worker compilato, oltre a quella già coperta da Node e atomicità D1.
- Setup aggiornato in docs/APPLE_NATIVE_SETUP.md, docs/BETA_SETUP.md, docs/WORKERS_SETUP.md. Piano/spec salvati. Check release resta negativo: mancano capability/firma reali, revoca presso Apple su eliminazione account, notifiche di revoca e invalidazione sessioni, OAuth reale, informative/moderazione e dispositivi. Non abilitare Apple per utenti reali prima di completarli.
- L'ultimo run GitHub esaminato, 42391564432, fallisce prima degli step anche sul commit7b5ad18: nessun log e causa non accertata. Non attribuirlo a fatturazione o codice senza annotazioni.
- Nessun deploy, costo, generazione AI reale, modifica a main o aggiramento della policy Cloudflare. Proseguire con completamento dei flussi di revoca Apple e servizi multiutente nel ramo; distribuzione e prove reali richiedono l'ambiente autorizzato già documentato.

## Revoca, cancellazione e notifiche Apple — implementate, disabilitate e verificate localmente, 7 novembre 2026
- Cancellazione Apple con nuova conferma nativa legata a sessione/nonce/state/verifier: stesso subject obbligatorio; scambio authorizationCode, verifica id_token restituito e revoca refresh token prima della cancellazione locale. Token effimeri nella richiesta, mai conservati o inviati al client. Client secret ES256 di dieci minuti da secret server ancora da configurare. Nessuna credenziale reale creata o letta.
- GET /api/account/deletion-method sceglie il flusso; DELETE generico rifiuta gli account Apple per evitare di saltare la revoca. Cancellazioni Google/Facebook conservate. Annullamento o errore remoto mantiene l'account e invita a riprovare, senza falsa conferma di cancellazione.
- Endpoint /auth/apple/notifications predisposto e separatamente disabilitato: JWT Apple firmato, audience/issuer/iat entro7giorni/exp eventuale/jti/eventi controllati. Supportati events oggetto/stringa e timestamp secondi/ms; ledger idempotente8giorni, stato forwarding e soglia di revoca persistenti. Sessioni più recenti dell'evento preservate; account-deleted elimina dati privati del solo provider Apple.
- Revisione indipendente ha riprodotto tre difetti concorrenti, poi tutti corretti RED→GREEN: login pendente che ricreava un account dopo cancellazione locale; identità persistita prima del rifiuto per revoca; notifica tardiva che cancellava una nuova autorizzazione. Ora tombstone/cancellazione atomici, creazione identità+sessione atomica dopo controllo soglia, grant con tempo autorizzazione. Considerato anche iat Apple avanti di30secondi: si usa il minimo tra iat e avvio server del tentativo.
- Migrazioni aggiuntive0002_apple_lifecycle.sql e0003_apple_session_grants.sql; entrambe applicate localmente (4+2comandi). Test D1/Worker applicano tutte le migrazioni in ordine. Quote globali AI conservate dopo cancellazione; stato minimo di revoca separato dai dati del profilo.
- Verifiche finali: npm test125/125; test:worker6/6; TypeScript exit0; export Expo web/iOS/Android exit0. Test sintetici per scambio/revoca/signature reali RSA+EC, sessioni concorrenti, notifiche duplicate e fuori ordine e prevenzione della ricreazione dopo cancellazione. La verifica concorrente Apple nel Worker precedentemente differita è ora coperta.
- Docs aggiornate: APPLE_NATIVE_SETUP.md, WORKERS_SETUP.md, BETA_SETUP.md, README e piano/spec lifecycle. Nessuna nota minore residua dalla revisione di questo blocco.
- APPLE_NATIVE_ENABLED e APPLE_NOTIFICATIONS_ENABLED restano false; check:release ready=false. Servono secret Apple del progetto, registrazione endpoint HTTPS, capability/firma, prove reali di login/cancellazione/revoca, privacy/moderazione e collaudi fisici. Nessun provider reale chiamato, deploy, costo, build firmata, merge in main o aggiornamento dell'anteprima.
- Diniego Cloudflare invariato: non ripetere login o usare proxy/runner per aggirarlo. Proseguire con servizi multiutente/incontri/chat nel ramo, oppure collaudo quando è disponibile l'ambiente normalmente autorizzato e configurato.

## API appuntamenti multiutente predisposte — 7 novembre 2026
- Aggiunti store SQL condiviso Node/D1, migrazione0004_meetings.sql e API private per candidati a due, decisioni/interesse reciproco e appuntamenti. Le coppie sono create solo da store.meetings.offerPair, servizio interno da collegare al matching: nessun endpoint pubblico per scegliere userId arbitrari.
- Due interessi reciproci e due profili con maggiore età dichiarata necessari prima della proposta. Solo i membri possono leggere/scrivere; risposte senza email/token/testi illustrati. Liste limitate50. Partecipanti/stati/conferme non modificabili nel payload. Eliminazione account cancella con cascata coppie e appuntamenti.
- Conferme concorrenti su stessa versione si sommano senza perdita. Revisione incrementa versione e azzera tutti i sì; versione obsoleta409; annullamento terminale. Mutazioni ricontrollano appartenenza, maggiore età e reciprocità dentro la stessa istruzione SQL. Attività, luogo dichiarato pubblico, data ISO futura con fuso entro180giorni e costo esplicito richiesti.
- Revisione indipendente ha riprodotto un merge di snapshot vecchio con versione attesa più recente che ripristinava un campo non modificato. Corretto RED→GREEN: versione snapshot verificata prima del merge, poi CAS nel write. Nota minore differita: retry di decision:no dopo risposta persa restituisce404 perché la coppia è nascosta, pur lasciando il rifiuto salvato; rendere trasparente prima della UI multiutente.
- Verifiche finali: npm test136/136, test:worker7/7, TypeScript exit0; migrazione0004 applicata localmente,4comandi riusciti. Incluse concorrenza D1/Worker, doppia conferma, isolamento, cascata e maggiore età modificata durante scrittura. Nessun export ripetuto: questo blocco modifica solo backend/test/config/documentazione e non il client o gli asset.
- MEETINGS_ENABLED=false in Node/Worker/config esempio; /api/config.features.meetings espone soltanto il flag. Demo e interfaccia pubblicata invariate; nessuna coppia, messaggio, prenotazione o pagamento reale creato. Non dichiarare matching o appuntamenti attivi.
- Guide/piano/spec: docs/MEETINGS_API.md e docs/superpowers/{specs/2026-11-07-meetings-design.md,plans/2026-11-07-meetings.md}. Prossimo incremento: UI multiutente separata dalla demo e generazione candidati con preferenze/consenso; poi chat, blocco/segnalazione/moderazione e collaudo con due account/dispositivi.
- Blocchi di distribuzione invariati: Cloudflare non accessibile per policy, credenziali/callback reali e build firmate da configurare. Nessun aggiramento, spesa, deploy, merge in main o modifica all'anteprima esistente.

## Completamento funzionale della beta — 7 novembre 2026
- Tre domini sviluppati separatamente e integrati: gruppi con organizzatore/posti/richieste; chat/sicurezza/moderazione; UI a due/preferenze. Root integra matching, immagini condivise, storico, notifiche e routing live. Nessun agente ha modificato GitHub direttamente.
- Matching con consenso disattivato per default, intenti/zone/disponibilità e interessi compatibili; creazione coppia condizionata atomicamente, una proposta attiva per persona e niente ritorno automatico di coppie rifiutate. Nessuna analisi delle immagini. Rinuncia ripetibile ora idempotente; ritiro di un sì annulla l'appuntamento con trigger.
- Revoca della scoperta ritira i candidati non reciproci. Connessioni già reciproche restano accessibili, come esplicitato nella UI. Illustrazioni condivise solo con consenso attuale, approvate e per coppia autorizzata: lettura bytes/consenso/blocchi in un unico snapshot SQL Node/D1, nessun prompt o anteprima privata.
- Gruppi2–20: organizzatore incluso, creazione/date/luoghi/costi chiari, richieste, approvazione/rifiuto e ultimo posto atomico; uscita/annullamento e chat soltanto membri approvati. Storie personali in Le mie balotte; incontri passati non riattivabili durante nuove proposte.
- Chat testuale privata con nomi visualizzati/orario e messaggi idempotenti, limiti20/minuto e5000totali. Blocchi bilaterali e sospensioni ricontrollati. Segnalazioni consentite anche per attività pubbliche visibili prima dell'ammissione; quote5nuove/giorno e5000totali, retry duplicati gratuiti, coda moderatore più vecchi irrisolti con risoluzione e contesto del contenuto. Ruolo da email verificate server, mai nel payload.
- Notifiche in-app con coda100perdestinatario/50visibili, lettura personale e collettiva idempotente, autorizzazioni correnti e metadati generici senza corpi chat/email. Nessun push/email esterno inviato; APNs/FCM restano fuori dall'implementazione attuale.
- Schermate live collegate ai flag reali, stati vuoti/errori/conflitti e azioni in corso; componenti privati rimontati per account. Demo isolata, nessun comando per simulare un'altra persona in live. Test browser ha riprodotto e corretto aria-checked mancante sulle checkbox web.
- Revisione indipendente: corretti RED→GREEN consenso pendente revocato ancora visibile; race nella lettura immagini; riapertura incontri passati mentre esiste altro candidato; flood che seppelliva le segnalazioni; impossibilità di segnalare gruppi da visitatore. Revisione inbox senza difetti importanti; completato lo svuotamento oltre la prima pagina. Nessun rilievo importante residuo in questi blocchi.
- Migrazioni0005–0009 applicate localmente in ordine (37comandi nelle cinque nuove migrazioni). Test D1 usano il parser ufficiale Wrangler fissato per preservare trigger multi-INSERT; lo splitter regex precedente causava errori di test e non è più usato.
- Prove finali: npm test195/195; Worker compilato9/9; TypeScript exit0; export Expo web/iOS/Android exit0. Origin QA locale assente dai bundle finali. Browser con due cookie sintetici a390px/Europe-Rome: interesse reciproco, ritratto approvato da asset del progetto (fixture), proposta, due conferme, messaggio, modifica che azzera i sì, creazione/richiesta/approvazione gruppo e lettura totale inbox. Fixture non equivale a generazione Cloudflare reale o validazione artistica.
- Guide aggiornate: APP_STATUS_2026-11-07.md, WORKERS_SETUP.md, MEETINGS_API.md, GROUPS_API.md, COMMUNITY_API.md, NOTIFICATIONS.md; piano/spec complete-beta. Codice e test salvati nel ramo dedicato con verifica dei blob remoti prima di dichiarare il salvataggio.
- Restano esterni/non verificati: accesso di rete autorizzato a Cloudflare, piano Free/quote reali, database/origin/callback/secret e account provider dedicati, progetto Expo/store, build firmate e telefoni, due immagini reali, informative/termini definitivi. Il Worker esempio è API-only; web reale richiede bundle statico sullo stesso origin o configurazione CORS/callback esplicita. Client nativi usano bearer/PKCE.
- Nessun pagamento, ricarica, invito/messaggio esterno, pubblicazione o modifica dell'anteprima esistente. Non riusare automaticamente secret di Fungo Italia. Le sezioni precedenti restano archivio storico, non coda di funzioni da risviluppare.

