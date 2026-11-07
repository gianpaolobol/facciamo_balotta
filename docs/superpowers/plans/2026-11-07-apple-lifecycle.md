# Apple lifecycle Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, authorized autonomously.

**Goal:** Revoca, cancellazione e invalidazione sessioni Apple con persistenza Node/D1.
**Architecture:** Nuova conferma Apple prima di eliminare; token effimeri e client secret WebCrypto ES256. Notifiche JWT con ledger atomico e soglia di revoca per subject.
**Tech Stack:** Expo58, Node24, WebCrypto, SQLite/D1, Miniflare.
**Spec:** docs/superpowers/specs/2026-11-07-apple-lifecycle-design.md

## Global Constraints
- Nessun accesso remoto, costo, chiave reale o attivazione.
- Tentativi di cancellazione cinque minuti, sessione corrente e subject identico.
- Client secret dieci minuti; ledger notifiche otto giorni, token evento massimo sette.
- Dati e sessioni di altri provider restano isolati; consumi globali non cancellati.

## Review Focus
- Consenso rimosso mentre un login è in corso: nessuna sessione da token precedente alla revoca.
- Notifica duplicata dopo nuova autorizzazione: non revocare la nuova sessione.
- Apple restituisce token di un'altra persona o nonce diverso: non cancellare.
- Token/revoke falliscono: account presente e messaggio ripetibile, nessuna falsa cancellazione.
- Cancellazione di account Google/Facebook conserva il percorso esistente.

### Task 1: Revoca e cancellazione nativa
- [x] Test RED per nuova conferma, subject errato, codice/token errati, provider indisponibile e cancellazione completa.
- [x] Implementare servizio client secret/token/revoke e route autenticate, getIdentity negli store, flusso nativo di cancellazione.
- [x] Test GREEN e suite completa.

### Task 2: Notifiche e persistenza
- [x] Test RED JWT evento, replay, isolamento, blocco login precedente alla revoca, cancellazione e forwarding.
- [x] Implementare verifica eventi, ledger/soglia persistenti Node/D1 con migrazione0002 e route disabilitata per default.
- [x] Verificare runtime Worker, concorrenza Apple, migrazioni locali, TypeScript/export e revisione indipendente.
- [x] Aggiornare continuità/setup e salvare sul ramo PR1 con verifica remota.

## Ledger
- Base291c5db8cb89ffaa52cceed64a1ac4252c088e99, copia isolata esistente; connettore GitHub con lease, nessun merge.
- Sessione Apple richiede soglia revoca atomica nello store; interfaccia putAppleSession restituisce false se il token precede l'evento.

- Revisione: tre rilievi confermati RED nei test di route/SQLite e D1: resurrezione dopo cancellazione locale; scrittura dell’identità prima del controllo revoca; eventi in ritardo che eliminavano sessioni più recenti.
- Correzione unica: tombstone e cancellazione atomici; identità/sessione create insieme dopo controllo soglia; grant temporali per invalidare solo autorizzazioni precedenti. Migrazione0003, nessun token provider persistito.
- Coperto anche iat Apple avanti di30secondi: RED riprodotto, soglia ora confrontata con il minimo fra iat e avvio server del tentativo.

- Task1/2: complete —125/125 test generali e6/6 Worker compilato, inclusi replay/concorrenza e regressioni della revisione. TypeScript exit0, export Expo web/iOS/Android exit0. Migrazioni0002/0003 applicate localmente,4+2 comandi riusciti.
- Tutti i tre rilievi della revisione corretti in un unico passaggio RED→GREEN. Nessuna nota minore differita. Il precedente test concorrente Apple nel Worker è ora incluso.
- Gate di rilascio ancora negativo: secret/endpoint/capability/firma e test Apple reali, provider reali, privacy e dispositivi mancanti. Tutti i flag restano disattivati.
