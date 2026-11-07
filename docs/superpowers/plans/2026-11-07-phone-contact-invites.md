# Phone Contacts Invitations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** Rubrica autorizzata, solo nomi e canali personali WhatsApp/SMS/email.
**Architecture:** Helper puro mapping/queue e controllo epoch; adapter Expo native/web; pannello comune con demo fittizia. API anonima precedente conservata separatamente.
**Tech Stack:** Expo58 Contacts legacy, SMS, MailComposer, Linking.
**Spec:** docs/superpowers/specs/2026-11-07-phone-contact-invites-design.md

## Global Constraints
- Nessun dato rubrica o nome caricato al server, nessun invio reale nei test.
- Solo nomi nel pannello e accessibilità; nota mittente personale veritiera.
- Consenso esplicito e readonly; nessuna azione automatica dopo permesso, import o ritorno da composer.

## Review Focus
- Contatto senza nome/omonimo/più recapiti: nessun numero esposto come nome, destinazione deterministica.
- Revoca permesso o cambio account durante import/compose: scartare dati/esiti obsoleti.
- Doppio tap e ritorno WhatsApp: una sola apertura e nessuna finta consegna.
- Recapiti condivisi selezionati più volte: una sola apertura per indirizzo/canale.
- SDK nativo non presente nel web, canale/composer indisponibile o URL assente: stato chiaro, nessun fallback personale nascosto.

### Task1 Adapter nativo
Files src/contact-invitations.native.ts,src/contact-invitations.ts,src/contact-adapter-flow.mjs,tests/contact-adapter.test.mjs.
- [x] RED test consenso rifiutato/limitato, import paginato, isCurrent, composer e risultati.
- [x] Implementare adapter con readContacts(isCurrent), hasPermission(), compose({channel,address,message}), invitationUrl export.
- [x] Verificare test/TypeScript; nessuna chiamata SDK operativa.

### Task2 Nomi e pannello
Files src/phone-invitations.mjs,src/InviteContacts.tsx,tests/phone-invitations.test.mjs,scripts/check-invitations-web.mjs.
- [x] RED mappingnomi/recapiti e queue doubletap/cancel/reset.
- [x] Implementare nuova UI solo nomi, scelta canale, preview, coda con gesto esplicito/skip.
- [x] Verificare browser demo mobile e assenza indirizzi in elenco/testi accessibili.

### Task3 Integrazione
Files app.config.ts,package*.json,.env.example,docs/INVITATIONS.md,CONTINUITA.md.
- [x] Plugin contatti e permessi sola lettura, dipendenze Expo58, URL pubblico dedicato.
- [x] Test generali/TypeScript/export tutte piattaforme, review, salvataggio remoto con hash verificati.
