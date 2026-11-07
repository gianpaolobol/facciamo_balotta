# Distribuzione — stato concreto

Richiesta corrente: rendere Facciamo Balotta disponibile su TestFlight e Google Play. APK Android demo0.1.0(2) prodotto con successo; IPA/AAB e pubblicazione store ancora da verificare. Non considerare i bundle Expo come binari firmati.

## Eseguito

- Creato progetto Expo dedicato `@gianpaolobol/facciamo-balotta`, UUID pubblico `ba138648-4f96-4571-b34c-567388ca51b8`; poi verificato con `eas project:info`. Il primo comando ha creato il progetto ma non poteva modificare app.config.ts dinamico: collegamento completato esplicitamente in `config/distribution.mjs` e app.config.ts. Nessun riuso di identificativi/secret di Fungo Italia.
- Autenticazione EAS esistente disponibile, account Owner con credenziali attuali limitate a Release Manager. Non è stata ampliata alcuna autorizzazione.
- Aggiunte icona1024 opaca e foreground adattivo Android dal simbolo originale tre punti di Brand; PNG rigenerabili con `npm run assets:brand`. Metadata verificati: icona RGB senza alpha, foreground RGBA, entrambi1024.
- Profilo EAS beta associato all'ambiente preview, produzione al proprio ambiente production. Non impostati URL backend fittizi o secret.
- Preparato archivio nativo allowlist `.easignore`. Primo controllo locale ha rilevato cartelle mancanti: corretti pattern directory e ripetuto il vero `eas build:inspect --stage archive`. Archivio verificato102file necessari,104totali,31MB; zero export generati/credenziali/env/database. Non è un upload o una build. Copia selettiva senza Git: usare deliberatamente `EAS_NO_VCS=1` e `EAS_PROJECT_ROOT` oppure un checkout pulito.
- Google Play: account esistente studio micologia accessibile; compilato modulo Crea app con nome Facciamo Balotta, pacchetto it.facciamobalotta.app, Italiano, App, Senza costi. Dichiarazioni conformità/esportazione NON accettate e Crea app NON inviato: nessun app record Android ancora creato.
- Apple Developer/App Store Connect autenticati tramite accesso sicuro: team BX9MDXAHKG. Registrato App ID esplicito it.facciamobalotta.app con Sign in with Apple primario e Push Notifications. Creata e verificata scheda Facciamo Balotta6832101489, SKU BALOTTA-IOS-001, italiano, iOS. TestFlight mostra No Builds. Nessun certificato/profilo/API key creato.
- Richiesta successiva: build demo installabili. Profilo demo con Android APK internal/medium e iOS store/medium, ambiente demo separato verificato vuoto negli scope account/progetto. Config submit demo/beta iOS con ascAppId6832101489 e team verificati. Nessun .env locale o variabile API/link inviti in shell.
- Piano Expo letto con account:usage: Starter,600/4500crediti utilizzati, overage corrente0centesimi. Nessun piano/pagamento/limite modificato. Questo dato precede le build e non ne certifica il successo.
- Google Auth Platform nel browser restituisce Site Unavailable; Meta non configurato. Login reali e backend rimangono distinti dalla demo offline.

## Passaggi immediati

1. App record e bundle Apple collegati; restano firme/provisioning per `it.facciamobalotta.app`. Nessuna password/OTP in chat o repository. Non accettare accordi legali senza conferma puntuale del titolare.
2. Completare le due dichiarazioni legali Google Play solo dopo revisione/conferma del titolare; creare il record e gestire eventuale requisito test chiuso dell'account. La pagina dell'account segnala anche dichiarazione commerciante da completare entro febbraio2027: non è stata classificata automaticamente.
3. Backend HTTPS normalmente autorizzato, D1/migrazioni, secret/OAuth/Apple/moderatore/allowlist e vere generazioni gratuite. Diniego Cloudflare invariato, non aggirato tramite Expo o altri runner. Senza backend la build rimane una demo illustrativa.
4. Informativa/termini, assistenza e URL definitivi, incluso link inviti. Non inventare email o attestazioni del titolare. Pubblicare l'accesso alle informative nella UI prima di utenti reali.
5. Configurare nell'ambiente EAS preview EXPO_PUBLIC_API_URL HTTPS verificato; link pubblico inviti solo se operativo. Push può restare spento per una beta deliberata. Verificare piano/quota build senza attivare spese aggiuntive prima di avviare job.
6. Produrre IPA/AAB firmati dallo stesso commit verificato; provare iPhone/iPad/Android. Caricare su App Store Connect/TestFlight e Google Play test interno, controllare processing/gruppi/release. Il profilo Android submit attuale è internal/draft: upload non equivale a disponibilità per tester né produzione.

## Verifica ripetibile

`npm run assets:brand`, `npm run typecheck`, `npm test`, `npm run export:all`. Per l'archivio locale:

```sh
EAS_NO_VCS=1 EAS_PROJECT_ROOT="$PWD" eas build:inspect --platform android --stage archive --profile beta --output ../balotta-native-archive
node scripts/verify-native-archive.mjs ../balotta-native-archive
```

L'output deve stare fuori dalla radice del progetto, in una nuova cartella; non cancellare altre copie con --force. Lo script confronta byte di tutti i sorgenti client/config/asset richiesti e respinge export/env/database/chiavi/log.

`check:release` resta un rapporto conservativo ready=false con prove manuali, non una promessa di pubblicazione. Riconosce ora il progetto reale; push opzionale non deve essere acceso solo per far sparire un campo mancante. La disponibilità dei servizi e le prove su telefoni rimangono separate dalla correttezza dell'archivio.

Riferimenti ufficiali: [Expo Build](https://docs.expo.dev/build/setup/), [submit iOS](https://docs.expo.dev/submit/ios/), [submit Android](https://docs.expo.dev/submit/android/), [TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/), [test per nuovi account personali Play](https://support.google.com/googleplay/android-developer/answer/14151465?hl=it). Per gli account personali a cui si applica il requisito Google, produzione richiede almeno12tester per14giorni consecutivi; non è un requisito del test interno.

## Checkpoint build demo

- Android: EAS FINISHED, job24804f14-58e7-40a6-9baa-3b7700035d46; sorgenti configurazione commit fee7bb661e78d22eecaf8213f065852e4f4ee061. APK106281973byte, SHA256d4312d8a5d85e8a40ad94a44a106871a6ec3af4454196f995d3cdd9c6c3d0eb4. Verificati manifest, DEX, bundle JS e librerie per arm64-v8a/armeabi-v7a/x86/x86_64; nessuna installazione/prova fisica. Non è una release Play Store.
- Apple: generato provisioning Facciamo Balotta App Store per bundle dedicato; UUID351c91f1-b239-413e-9e06-1c89618b765b, scadenza2027-10-09. Decodifica CMS verifica team/bundle/Sign in with Apple e corrispondenza del seriale del certificato di distribuzione account già conservato su Expo. Non copiati secret da altre app; nessuna nuova API key/certificato privato.
- Config EAS iOS dedicata salvata tramite interfaccia web con certificato esistente e provisioning nuovo, entrambi Valid. Push/API Submit saltati. Primo tentativo senza firma fallito; secondo annullato al prompt password senza inserirla. Nuovo tentativo firmato non interattivo in avvio con buildNumber3: verificare job/esito prima di dichiarare IPA completato.
- Profilo mobileprovision è fuori repository, escluso da Git e dai pacchetti utente. APK scaricato fuori repository.

## Blocchi successivi verificati

- Il nuovo comando iOS firmato con buildNumber3 si è fermato durante Using remote iOS credentials: il polling del processo ha restituito `Network access to "https://api.expo.dev:443" was blocked by policy.` Nessun URL job/IPA iOS è stato restituito o verificato. Non ripetere la chiamata e non aggirare la policy tramite browser, GitHub Actions, proxy o altri runner.
- Apple Integrations mostra una sola Team API key attiva, nome fungoitalia, ruolo Admin; già presente nello stesso account Expo. Metadati verificati, nessun segreto letto/scaricato. Il tentativo di aprire Choose saved ASC API key è stato rifiutato da auto-review per rischio di riuso da altra app senza autorizzazione specifica per Balotta. Nessuna selezione/associazione/nuova chiave eseguita. Richiedere consenso specifico per quel riuso prima di riprovare; alternativa: chiave dedicata da configurare con autorizzazione. Non aggirare il rifiuto tramite CLI/API.
- Queste limitazioni impediscono la dichiarazione di completamento iOS/TestFlight. Android APK è già disponibile dal job concluso, senza pubblicazione Play Store o prova su telefono.
