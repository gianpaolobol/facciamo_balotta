# Complete functional beta Implementation Plan

> **For agentic workers:** Independent domains may run in parallel under superpowers:dispatching-parallel-agents. Root integrates shared files and persists checkpoints.

**Goal:** Completare i percorsi funzionali locali della beta iOS/Android senza dichiarare una distribuzione reale.
**Architecture:** Moduli SQL asincroni condivisi Node/D1 e route autenticate, UI Expo separata dalla demo, feature flag off. Matching locale spiegabile, nessun provider AI a pagamento aggiuntivo.
**Tech Stack:** Expo58/React Native, Node24, SQLite/D1, Worker/Miniflare.
**Spec:** docs/superpowers/specs/2026-11-07-complete-beta-design.md

## Global Constraints
- Nessuna chiave reale, costo, invio esterno, deploy o aggiramento policy.
- Migrazioni0005community,0006groups,0007matching; nomi definiti prima del lavoro parallelo.
- Moduli store factory({first,all}) con SQL atomico; route({path,request,user,jsonBody}) ->Response|null.
- Root possiede integrazione store/auth/worker/App; agenti solo file assegnati.

## Review Focus
- Blocchi/sospensioni inseriti durante richiesta impediscono write e letture successive.
- Posti/candidati/messaggi concorrenti rispettano limiti e appartenenza.
- Profilo/preferenze/account cambiati non lasciano dati privati nel client successivo.
- Nessun ruolo o membro selezionabile via payload, nessuna email nei risultati sociali.
- Funzioni disabilitate/zero risultati/errori di rete non mostrano successi fittizi.

### Task1: Gruppi e UI
- [x] Test RED, store/routes/migrazione0006, LiveGroups con richieste/approvazione/creazione/uscita/annullamento/chat.
### Task2: Chat, blocchi e moderazione
- [x] Test RED, store/routes/migrazione0005, controlli atomici e componenti client di sicurezza/chat/moderazione.
### Task3: Matching e UI a due
- [x] Preferenze/consenso, matching atomico, spiegazioni, migrazione0007 e test.
- [x] LivePair/PreferencesPanel collegati a API, senza simulazioni live.
### Task4: Integrazione e verifica
- [x] Integrare moduli/config/feature gate/ritiro interesse e retry no.
- [x] Suite completa, D1/Worker, typecheck/export, verifica browser e revisione indipendente.
- [x] Checkpoint verificati su GitHub, guide di configurazione e limiti esterni aggiornati.

## Ledger
- Base6a2b9a2319629040537b1a99a8295a203fa32846; copia selettiva isolata, commit tramite connettore con lease e main invariato.

- Task1/2/3: moduli indipendenti completati, integrati e verificati. Matching deterministico con consenso, UI live e profilo illustrato condiviso approvato; nessun matching estetico.
- Task4:195/195 test generali,9/9 Worker compilato, TypeScript0 e browser mobile con due account sintetici. Migrazioni0005–0009 applicate localmente (9+10+7+2+9comandi). Export finale web/iOS/Android exit0; origin locale della QA assente dai bundle finali. Browser finale supera anche illustrazione approvata del progetto e lettura collettiva delle notifiche.
- Revisione indipendente: corretti RED→GREEN consenso revocato ancora visibile, lettura immagini non atomica, riattivazione incontri passati, flood/coda segnalazioni e segnalazioni gruppi da visitatori. Coda risolvibile e limiti atomici. Nessun rilievo importante residuo.
- Revisione notifiche: nessun difetto importante; completata lettura collettiva per svuotare anche gli eventi fuori dalla prima pagina, con regressioni su accessi/race/blocchi.
- Browser ha riprodotto un difetto ARIA delle checkbox: il valore cambiava ma non era esposto su web. Aggiunto aria-checked conservando accessibilityState nativo; prova ripetuta superata.
- Test D1 ora usano unstable_splitSqlQuery del Wrangler fissato: il vecchio splitter regex interrompeva i trigger con più INSERT; migrazioni e suite reali superate dopo correzione.
- Scelta: disattivare la scoperta ritira le coppie ancora non reciproche. Le connessioni già reciproche restano accessibili; immagini condivise nascoste senza consenso attuale. La copia UI esplicita il comportamento.
- Push nativi esclusi dal perimetro implementato: inbox interna pronta, APNs/FCM e dispositivi reali restano lavoro esterno. Nessun servizio/chiave/pagamento o pubblicazione attivati.
