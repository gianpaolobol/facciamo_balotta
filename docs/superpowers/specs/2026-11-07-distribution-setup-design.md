# Predisposizione distribuzione native

Richiesta approvata: portare l'app verso TestFlight e Google Play. Primo percorso: TestFlight interno e Google Play test interno, poi collaudi/iter di pubblicazione. Non presentare demo/export come app operativa pubblicata.

Stato verificato: codice276test/11Worker e export riusciti, nessun IPA/AAB; EAS autenticato come gianpaolobol con credenziali limitate ReleaseManager; progetto dedicato appena creato `ba138648-4f96-4571-b34c-567388ca51b8` @gianpaolobol/facciamo-balotta. Accesso Play mostra account studio micologia; Apple login necessario. Nessun piano/spesa modificato.

Scelta autonoma di packaging: mantenere UI/font e identificativi it.facciamobalotta.app, collegare projectID Expo reale, riutilizzare il simbolo tre punti del Brand esistente per icona1024 opaca e adaptive Android. Sorgente vettoriale e PNG rigenerabili senza cambiare il marchio.

Archivio EAS allowlist di sorgenti client/config/asset runtime: escludere export dist-*, server DB/env/log/test/doc/credenziali e copie storiche. Verificare archivio locale in modalità non-VCS esplicita, perché la copia selettiva non è un checkout. Nessun upload/build/submit se non esistono configurazione pubblica, credenziali/capacità e quota gratuita verificate. Non aggirare Cloudflare o GitHub billing via EAS; EAS è soltanto il percorso native della nuova app.

Restano esterni backend HTTPS/OAuth/AI reali, prove native, account/capability/firme e app record, informative/contatti/URL definitivi, release/review. Non inventare support email, URL policy, AppStore ID o attestazioni legali. Nessuna nuova APIkey o upload a pagamento.
