# Distribution Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** Collegare progetto Expo verificato e preparare packaging nativo concreto.
**Architecture:** Config condivisa projectID dedicato, icona derivata da Brand esistente, archivio allowlist e controlli reali della configurazione.
**Tech Stack:** Expo58, EAS CLI, SVG/Sharp, GitHub.
**Spec:** docs/superpowers/specs/2026-11-07-distribution-setup-design.md

## Global Constraints
- Nessun pagamento, deploy o aggiramento dei dinieghi esistenti.
- Asset coerenti col Brand; projectID reale pubblico, nessun secret nel Git.
- Nessuna credenziale/attestazione/AppStoreID inventata; export non equivalente a build.

## Review Focus
- Copie dist-* o env/credenziali finite nell'archivio: ispezione locale concreta prima di upload.
- ProjectID di Fungo Italia o altro account: verificare slug/owner/UUID dedicati.
- Icone con trasparenza iOS o riferimenti mancanti: controllare raster opaco1024/config.
- Backend non configurato: non lanciare release come beta funzionale.
- Store login o accordi mancanti: ottenere accesso sicuro, non firmare accordi o attivare spese.

### Task1 Packaging e progetto
- [x] Aggiungere config/distribution.mjs, icone Brand e script generazione, collegare app.config, ignorare export e allowlist .easignore.
- [x] Verificare project:info, config/introspezione e metadata/raster icone.
- [x] Ispezionare archivio EAS locale senza upload/build.

### Task2 Stato store e continuità
- [x] Verificare accessi AppStore/Play, compilare passi mancanti senza attestazioni inventate.
- [x] Test/config export interessati e salvataggio remoto verificato.
- [ ] Apple richiede credenziali: richiesta sicura/handoff soltanto dopo salvataggio del lavoro indipendente.
