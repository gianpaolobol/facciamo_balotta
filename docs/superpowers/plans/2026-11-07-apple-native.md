# Apple native login Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline; user requests autonomous execution.

**Goal:** Predisporre un accesso Apple nativo autenticato e disabilitato per default.
**Architecture:** Expo AppleAuthentication, nonce server monouso e challenge S256; verifica WebCrypto RS256 nel backend Node/Workers esistente.
**Tech Stack:** Expo58, Node24, Workers/D1, WebCrypto.
**Spec:** docs/superpowers/specs/2026-11-07-apple-native-design.md

## Global Constraints
- Nessun deploy, credenziale o costo nuovo; APPLE_NATIVE_ENABLED=false.
- Bundle it.facciamobalotta.app, audience unica; tentativo valido cinque minuti.
- Nessuna unione degli account in base all'email e nessun token Apple persistito.

## Review Focus
- JWT firmato con audience/nonce errati o scaduto: nessuna sessione.
- Replay concorrente e verifier errato: tentativo consumato una sola volta.
- Email relay: serve invito alla stessa email attestata da Apple.
- iOS non supportato/Android/web: nessun pulsante nativo Apple.
- Chiavi Apple malformate/servizio assente: errore chiuso senza token o dettagli sensibili.

### Task 1: Backend e test
- [x] Scrivere tests/apple-auth.test.mjs con chiavi RSA sintetiche, login/sessione/replay e rifiuti JWT/allowlist; eseguire RED (route assente).
- [x] Implementare server/apple-token.mjs e route native in server/auth.mjs, configurazione Node/Worker, nessuna migrazione nuova.
- [x] Eseguire i test dedicati GREEN e la suite completa.

### Task 2: Client e verifica complessiva
- [x] Installare expo-apple-authentication compatibile SDK58; plugin app.config.ts.
- [x] Integrare challenge, nonce, controllo state e pulsante nativo ufficiale; mantenere Google/Facebook e demo.
- [x] Eseguire TypeScript, test generali, runtime Worker e export Expo web/iOS/Android.
- [x] Revisione indipendente, documentazione dei limiti reali e salvataggio verificato su branch/PR1.

## Ledger
- Base remoto 7b5ad189c2a8a34b8119386fceb6fac9162df7c3. Copia selettiva isolata balotta-profile già in uso, non checkout Git: commit tramite connettore con lease sul ramo dedicato. Nessuna modifica a main.
- Le interfacce condivise consumano store.putAttempt/takeAttempt async e sessionResponse esistenti; nessun conflitto di schema.

- Task 1: complete — route RED 9/9 assenti, poi JWT reali sintetici e controlli negativi GREEN. Nessuna credenziale o token reale.
- Task 2: complete — npm test108/108; runtime Worker4/4; typecheck0; export web/iOS/Android0. Revisione indipendente senza difetti importanti/critici.
- Final review: nota minore differita — prova concorrente dello scambio Apple nel Worker compilato; concorrenza già coperta nel backend Node e atomicità DELETE RETURNING nello store D1. Il test Worker corrente verifica firma sintetica, sessione D1 e replay sequenziale.
- Corretta documentazione obsoleta di setup: Apple implementato ma disabilitato, non già attivo. Gate di rilascio conserva revoche/notifiche/device tests aperti.
