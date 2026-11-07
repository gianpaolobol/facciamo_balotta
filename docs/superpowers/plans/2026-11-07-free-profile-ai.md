# Free Profile AI Implementation Plan

> For agentic workers: continue inline with superpowers:executing-plans.

Goal: collegare una generazione di immagini con API gratuita e mantenere font e direzione grafica del progetto.
Architecture: adapter server Cloudflare FLUX2 Klein4B con due riferimenti visivi, API privata per immagini per slot, consumo persistente SQLite e approvazione separata. Credenziali solo server; nessun fallback a pagamento.
Tech Stack: Node24 fetch/FormData, SQLite, Expo/React Native, TypeScript, node:test.
Spec: docs/superpowers/specs/2026-11-07-free-profile-ai.md.

- [x] Ricerca primaria di API, quota gratuita, riferimenti supportati e protocollo multipart.
- [x] Controllo configurazione senza esporre segreti: nessun token/account Cloudflare presente.
- [x] Adapter e test RED-GREEN: modello/host pinning, credenziali server, due riferimenti, errori, no retry/fallback, formato e dimensione risposta.
- [x] Store/API e test RED-GREEN: budget atomico, isolamento utente, approvazione/scarto/rigenerazione, risposte tardive, account cancellato, riapertura database, limiti globali e per utente.
- [x] UI collegata con provider disabilitato fino a configurazione verificata. In demo nessuna generazione.
- [x] Revisione indipendente: corretti blocco dovuto alla chiusura del form durante generazione e scarto della prima anteprima. Entrambi riprodotti con controllo browser fallito e poi superato.
- [x] 87 test; TypeScript; export web/iOS/Android da sorgenti finali.
- [x] Browser: genera fixture, impedisce chiusura durante richiesta, scarta prima anteprima, approva e conserva immagine approvata se rigenerazione fallisce.
- [ ] Autenticazione sicura Cloudflare, verifica Workers Free e configurazione credenziali.
- [ ] Due generazioni reali e confronto visivo con gli asset approvati. Non sostituire questo controllo con fixture o con immagini generate da un altro fornitore.

Il font TTF non è stato modificato. Riferimenti ridotti: assets/ai-reference/cooking.jpg e hiking.jpg, con provenienza nel manifest.

## QA riproducibile
1. Esportare il frontend di test con EXPO_PUBLIC_API_URL=http://127.0.0.1:8766 e npx expo export --platform web --output-dir dist-test.
2. Con Playwright e Chromium disponibili nell'ambiente, eseguire node scripts/check-profile-images-web.mjs. Facoltativi PLAYWRIGHT_MODULE_PATH e BROWSER_EXECUTABLE_PATH per i runtime esterni. PROFILE_WEB_DIR seleziona la cartella esportata.
3. Lo script avvia un backend locale con sessione sintetica e immagine pixel dichiarata come fixture. Non legge token Cloudflare e non chiama il provider reale.
