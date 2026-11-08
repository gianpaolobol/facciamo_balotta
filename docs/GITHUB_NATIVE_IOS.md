# iOS direttamente da GitHub e Xcode

Direzione richiesta l'8 novembre 2026: compilazione nativa su GitHub, invio diretto ad Apple. Non delegare a un runner il comando EAS negato. Questo percorso usa Xcode e non chiama le API Expo: Expo CLI genera soltanto il progetto iOS, in modalita offline.

## Preparato

- .github/workflows/ios-native.yml: solo workflow_dispatch, senza trigger push/PR. Controllo credenziali Ubuntu prima del runner macOS.
- scripts/github-ios-native.sh: firma/profilo temporanei, controllo identita, archivio/IPA Xcode, upload altool diretto ad Apple.
- Team BX9MDXAHKG; bundle it.facciamobalotta.app; scheda Apple6832101489.
- Chiave di invio dedicata Balotta GitHub, ruolo Developer, ID pubblico SHK6U3T299, issuer8f57d241-76f9-4226-a912-f2ef24ac1a92. Nessun download da Expo.
- API/link inviti vuoti: demo illustrativa. Nessun accesso social o servizio reale dichiarato attivo.

## Prerequisiti ancora mancanti

GitHub Settings di Balotta mostra **This repository has no secrets** e **This environment has no secrets**. Nessun valore privato letto o trasferito.

| Segreto GitHub | Contenuto |
| --- | --- |
| IOS_DISTRIBUTION_P12_BASE64 | Certificato Apple Distribution e chiave privata in P12/Base64 |
| IOS_DISTRIBUTION_P12_PASSWORD | Password non vuota del P12 |
| IOS_APP_STORE_PROFILE_BASE64 | Profilo App Store di Balotta in Base64, corrispondente al certificato |
| ASC_API_KEY_P8 | Chiave privata App Store Connect autorizzata; necessaria solo per upload |

Usare copie originali ottenute normalmente e autorizzate. Non recuperare secret attraverso l'API Expo gia negata. Nuove credenziali o trasferimenti a GitHub richiedono le autorizzazioni applicabili prima dell'azione. Non chiedere password/chiavi nel testo della chat e non inserirle in Git o artifact.

PR #1 integrata in main al commit 9c2388b0fa3a399b0a650a7d8c8e00c95bc674b7. Workflow presente nel ramo predefinito; CI controlli/export run42426621708 completata success/success. Nessun avvio nativo prima dei segreti di firma.

Repository resa pubblica su richiesta dell’utente: i runner GitHub standard per repository pubbliche non consumano la quota inclusa. Non selezionare larger runner o risorse a pagamento. Visibilita cambiata su richiesta esplicita; non modificati piano, limiti o pagamenti. Nessun job nativo GitHub avviato.

## Preparazione credenziali dedicate — in attesa di conferma

Creazione e custodia nei segreti GitHub autorizzate esplicitamente dall'utente l'8 novembre 2026. Creata Team API key Balotta GitHub (SHK6U3T299), ruolo Developer; creata Apple Distribution R2YAMH7B2W, SHA1 9572CC36BA5BBB5A1969E17A35E8B2614BD5B6E1, con chiave privata locale corrispondente. Il ruolo Developer della Team key vale per il team Apple. P8, P12 e password risultano nei segreti cifrati di questo repository; nessun valore in Git/log/artifact. Profilo dedicato Balotta GitHub App Store creato (L2R5BNK34M / a521e473-151f-453b-ae35-738e30a8c7f0), decodificato e verificato contro nuovo certificato e capability. Nessuna credenziale delle altre app revocata o modificata. Script aggiornato all'ID pubblico della nuova chiave.

## Firma e output

- Profilo App Store non scaduto, team/bundle e Sign in with Apple esatti; chiave privata corrispondente al certificato.
- Profili installati nei percorsi legacy/moderni Xcode, senza sovrascrivere file esistenti. Cleanup dei soli profili installati, del portachiavi e dei file temporanei.
- Numero build: 1000 + 100*GITHUB_RUN_NUMBER + GITHUB_RUN_ATTEMPT, tentativo inferiore a100. Contatore indipendente da EAS: evitare futuri invii EAS inferiori alla build Apple.
- Conservati solo IPA e checksum dopo verifica di archivio e IPA esportata. Il binario validato resta disponibile anche dopo un errore di upload Apple.
- Upload riuscito non equivale a processing completato o disponibilita al gruppo TestFlight. Nessun tester/gruppo/invito creato automaticamente.

## Prove effettive

- Prebuild iOS offline riuscito in copia temporanea; non e compilazione Xcode.
- Parsing YAML, solo avvio manuale, dipendenza Mac dal controllo credenziali.
- bash -n e parsing dei blocchi Python riusciti.
- Profilo Balotta gia scaricato verificato contro team/bundle/scadenza/capability. Configurazione applicata al vero progetto generato e riletta con Node/xcode: Debug e Release con firma manuale, team esatto e build1101 nella prova.
- Revisione indipendente: corretto salvataggio di IPA prima della validazione; marker ora scritto dopo controllo IPA e prima dell'upload. Eliminata dipendenza Ruby/xcodeproj non garantita. Seconda revisione senza rilievi importanti.
- **Non verificati** su host Linux: CocoaPods/macOS, Xcode, firma reale, export IPA, upload Apple. Nessuna build iOS o disponibilita TestFlight dichiarata.

Riferimenti: [Expo locale](https://docs.expo.dev/guides/local-app-development/), [upload Apple](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/), [quote GitHub](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
