# Native Push Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Aggiungere avvisi push generici facoltativi senza invii reali.
**Architecture:** Store condiviso SQLite/D1 con session binding e token cifrati; dispatcher Expo limitato; UI nativa a consenso esplicito e adattatore web vuoto.
**Tech Stack:** Expo58, WebCrypto, SQLite/D1, Worker.
**Spec:** docs/superpowers/specs/2026-11-07-native-push-design.md

## Global Constraints
- Default disattivato, nessun cron/deploy/spesa/provider reale.
- Payload generico fisso, token server cifrati, prova installazione hashata.
- Test prima dell'implementazione; salvataggio remoto verificato a blocchi.

## Review Focus
- Cambio account mentre il consenso/token è in volo: non associare la vecchia sessione alla nuova persona.
- Logout/revoca Apple: session binding rende il dispositivo inutilizzabile.
- Claim concorrenti e retry: quote atomiche e nessun invio duplicato.
- Blocco/lettura dopo accodamento: ricontrollare visibilità corrente prima dell'invio.
- Token ruotato mentre arriva vecchia ricevuta: non revocare il nuovo token.

### Task1: Persistenza e trasporto
Files: server/push-store.mjs, server/push.mjs, server/push-dispatch.mjs, migrations/0010_push.sql, tests/push.test.mjs.
Interfaces: createPushStore({first,all}); createPushRoutes({store,config}); dispatchPush({store,config,fetchImpl,now}); pushReady(config). Route POST/api/push/device e POST/auth/push/disable definite nella spec.
- [x] Scrivere test di consenso, proprietà, revoca, cifratura, quote, ricevute/versioni, visibilità e guardia default off; osservarli fallire.
- [x] Implementare moduli senza modificare adattatori HTTP/Worker condivisi.
- [x] Verificare node --test tests/push*.test.mjs.

### Task2: Client nativo
Files: src/NativePushPanel.native.tsx, src/NativePushPanel.tsx, src/native-push-flow.mjs, src/push-device.native.ts, src/push-device.ts, tests/native-push-flow.test.mjs.
Interfaces: NativePushPanel({userId}); disableNativePush():Promise<void>. UI invoca API della spec con consenso esplicito, rimuove stato account precedente; nessun import SDK nativo nel web.
- [x] Scrivere test flusso con rifiuto, errori, cambio account e revoca; osservarli fallire.
- [x] Implementare helper/UI isolati; nessuna modifica auth/package/config condivisa.
- [x] Verificare test e segnalare dipendenze Expo richieste.

### Task3: Integrazione e verifica
Files: server/store.mjs, server/d1-store.mjs, server/http.mjs, server/index.mjs, worker/index.mjs, src/auth.ts, src/LiveArea.tsx, package*.json, app.config.ts, wrangler.jsonc, docs/NOTIFICATIONS.md, CONTINUITA.md.
- [x] Integrare store, route incluse revoche con origine controllata, config pubblica booleana, hook scheduled senza cron, panel e revoca logout.
- [x] Installare dipendenze Expo58 compatibili; eseguire test generali, TypeScript, Worker/D1 ed export multipiattaforma.
- [x] Rivedere privacy/race/quote, aggiornare documentazione e salvare remoto con rilettura verificata.
