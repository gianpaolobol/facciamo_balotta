# Distribuzione — stato concreto

Richiesta corrente: rendere Facciamo Balotta disponibile su TestFlight e Google Play. Nessun IPA/AAB è stato prodotto, caricato o pubblicato. Non considerare i bundle Expo come binari firmati.

## Eseguito

- Creato progetto Expo dedicato `@gianpaolobol/facciamo-balotta`, UUID pubblico `ba138648-4f96-4571-b34c-567388ca51b8`; poi verificato con `eas project:info`. Il primo comando ha creato il progetto ma non poteva modificare app.config.ts dinamico: collegamento completato esplicitamente in `config/distribution.mjs` e app.config.ts. Nessun riuso di identificativi/secret di Fungo Italia.
- Autenticazione EAS esistente disponibile, account Owner con credenziali attuali limitate a Release Manager. Non è stata ampliata alcuna autorizzazione.
- Aggiunte icona1024 opaca e foreground adattivo Android dal simbolo originale tre punti di Brand; PNG rigenerabili con `npm run assets:brand`. Metadata verificati: icona RGB senza alpha, foreground RGBA, entrambi1024.
- Profilo EAS beta associato all'ambiente preview, produzione al proprio ambiente production. Non impostati URL backend fittizi o secret.
- Preparato archivio nativo allowlist `.easignore`. Primo controllo locale ha rilevato cartelle mancanti: corretti pattern directory e ripetuto il vero `eas build:inspect --stage archive`. Archivio verificato102file necessari,104totali,31MB; zero export generati/credenziali/env/database. Non è un upload o una build. Copia selettiva senza Git: usare deliberatamente `EAS_NO_VCS=1` e `EAS_PROJECT_ROOT` oppure un checkout pulito.
- Google Play: account esistente studio micologia accessibile; compilato modulo Crea app con nome Facciamo Balotta, pacchetto it.facciamobalotta.app, Italiano, App, Senza costi. Dichiarazioni conformità/esportazione NON accettate e Crea app NON inviato: nessun app record Android ancora creato.
- App Store Connect: aperta schermata di login, nessuna sessione Apple autenticata verificata. Nessun app record/bundle capability/firma modificato.

## Passaggi immediati

1. Login Apple tramite richiesta sicura/browser autorizzato; creare/collegare app record iOS e bundle `it.facciamobalotta.app`, capability e firme dedicate. Nessuna password/OTP in chat o repository. Non accettare accordi legali senza conferma puntuale del titolare.
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
