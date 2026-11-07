# Progress — plan: docs/superpowers/plans/2026-11-07-distribution-setup.md

Baseline remoto6da8be3b5963b115c8eba5f42072dbad83c8042d. Richiesta successiva esplicita: procedere e pubblicare su TestFlight e Play Store. Nessun pagamento autorizzato/eseguito in questo blocco.

- Progetto EAS dedicato creato e verificato viaAPI/CLI come @gianpaolobol/facciamo-balotta, ba138648-4f96-4571-b34c-567388ca51b8. Collegamento config dinamica eseguito esplicitamente dopo il messaggio CLI che non poteva scriverlo da solo. Owner reale pubblico nel codice, nessun secret.
- Icona nativa derivata dal Brand originale e foreground Android generati con Sharp versione bloccata. Ispezionata immagine, verificati1024px/RGB opaco e RGBA adattivo.
- Revisione indipendente distribuzione: icon/projectenv/archivio/firmastore/URLlegali ancora mancanti. Risolti packaging e project linkage. Le altre dipendono da account/provider/contenuti reali e sono elencate in DISTRIBUTION_2026-11-07.md.
- Ispezione archivio EAS reale locale: prima allowlist con patterncartelle terminanti slash escludeva src/config/assets; scriptverifica osservato fallire su AppleSignInButton. Correzione pattern e nuova ispezione:102file richiesti confrontati byteperbyte,104totali,31MB, zeroexport/env/key/database/log. Nessun upload ojobbuild.
- Verifica finale npmtest276/276, typecheck0, expoexportweb/iOS/Android0. Assetrenderer e appconfig verificati. Il checkrelease resta readyfalse e non finge una firma oconfigurazione backend; push opzionale non è prerequisito artificiale per beta.
- Browser Play: accountstudio micologia accessibile, modulo nuovaapp compilato FacciamoBalotta/it.facciamobalotta.app/Italiano/App/Senzacosti. Due attestazioni legali non selezionate; Creaapp non inviato, nessun record creato. Apple fermo a login non autenticato; predisporre richiesta sicura dopo salvataggio di questo blocco.
- Blocchi operativi persistenti: API/OAuth/AI backend non attivati, diniegoCloudflare nonaggirato, CIbillinglimit, URLprivacy/termini/supporto, firme/provefisiche/store. Nessuna app disponibile ai tester/pubblico ancora.
