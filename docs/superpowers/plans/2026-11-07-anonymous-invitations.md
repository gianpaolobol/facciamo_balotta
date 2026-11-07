# Anonymous Invitations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** Selezione multipla e invio ufficiale anonimo predisposto per tutti i contatti scelti.
**Architecture:** Helper condiviso selezione/normalizzazione e controller; pannello demo/live; API gated con adattatore e ledger SQLite/D1.
**Tech Stack:** Expo58, React Native, SQLite/D1, fetch provider iniettato.
**Spec:** docs/superpowers/specs/2026-11-07-anonymous-invitations-design.md

## Global Constraints
- Nessun invio reale o spesa, nessun accesso automatico rubrica.
- Nota piccola esatta dalla spec, messaggio ufficiale senza identità invitante.
- API defaultoff e UI trasparente; tutti e soli i selezionati, retry idempotenti.

## Review Focus
- Selezione con duplicati/formati diversi: destinatario singolo.
- Doppio tap/retry: non inviare due volte.
- Cambio account durante risposta: non conservare contatti/esiti precedenti.
- Invii parziali/timeouts: non mostrare consegna globale.
- Provider assente/personale/non gratuito: non inviare né promettere anonimato operativo.

### Task1: Backend
Files server/invitations.mjs,server/invitations-store.mjs,migrations/0011_invitations.sql,tests/invitations-api.test.mjs.
- [x] Test RED autenticazione, gatewayoff, anonimato, selezione/dedup, quote/idempotenza/concorrenza e timeout.
- [x] Implementare store condiviso {first,all} e route createInvitationRoutes({store,config,invitationProvider}); invitationReady(config,provider).
- [x] Verificare test di dominio/API.

### Task2: Flusso client
Files src/invitations.mjs,src/InviteContacts.tsx,tests/invitations.test.mjs.
- [x] Test RED normalizzazione, tutti/solo selezionati, controller busy/retry/cambio account e risultati parziali.
- [x] Implementare UI facoltativa con nota piccola sotto selezione e prima conferma, demo esplicita.
- [x] Verificare test e TypeScript.

### Task3: Integrazione
Files src/screens/Profile.tsx,server/{auth,store,d1-store,index}.mjs,worker/index.mjs,config/docs.
- [x] Collegare API/config/schema e pannello account scoped. Adattatore reale assente, flagfalse.
- [x] Eseguire suite, Worker/D1, typecheck ed export; rivedere comportamento e salvare con hash remoto verificato.
