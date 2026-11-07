# Illustrated Profile Form Implementation Plan

> For agentic workers: continue inline with superpowers:executing-plans.

Goal: collegare le descrizioni approvate alla schermata Profile con conferme indipendenti.
Architecture: hook React in memoria, validazione condivisa nel modulo illustrated-profile, componente React Native separato dal salvataggio del profilo.
Tech Stack: Expo 58, React 19, React Native, TypeScript, node:test.
Spec: requisiti approvati in docs/RECUPERO_2026-11-06.md e README.md.

## Vincoli
- Ritratto facoltativo e massimo cinque interessi distinti.
- Una modifica annulla soltanto la conferma del testo modificato.
- Confermare un testo non equivale ad approvare un'immagine generata.
- Bozza temporanea senza persistenza o richieste AI; avviso esplicito nella UI.
- Demo con descrizioni inventate; reset attraverso smontaggio e ProfileScope già esistente.

## Esecuzione
- [x] Materializzare sorgenti, test e tutti i JPEG/TTF runtime dal ramo, verificando gli SHA Git. Gli originali PNG non sono richiesti per l'esecuzione.
- [x] Installare le dipendenze dal lockfile con npm ci --ignore-scripts --no-audit --no-fund.
- [x] Test RED, poi hook src/illustrated-profile-form.mjs: campi, conferme, input vuoti, duplicati, limite di lunghezza e reset.
- [x] Collegare src/IllustratedProfileForm.tsx a src/screens/Profile.tsx senza includere i testi nel PUT del profilo.
- [x] Revisione indipendente: correggere il blocco causato da duplicati in campi estranei e portare il messaggio di errore nel campo interessato, con due test RED-GREEN.
- [x] npm test: 54/54. npm run typecheck: exit 0.
- [ ] Controllo visivo browser e dispositivi nativi prima di integrare il ramo: Playwright non disponibile; il download del browser ha restituito un archivio non valido.

## Decisioni di implementazione
- 1000 caratteri per campo come limite locale; sei campi con identità fisse per evitare spostamenti delle conferme quando un interesse viene cancellato.
- Sezione richiudibile; la chiusura conserva la bozza fino all'uscita dalla schermata.
- Errori vicini al campo e disponibili come accessibilityHint; nessun nuovo servizio esterno.

## Incrementi successivi
Persistenza autenticata della bozza; generazione server con credenziali sicure; risultati versionati, approvazione e rigenerazione della singola immagine. Nessuno di questi incrementi è incluso in questo blocco.
