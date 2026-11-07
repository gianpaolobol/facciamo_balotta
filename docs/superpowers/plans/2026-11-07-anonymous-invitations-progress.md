# Progress — plan: docs/superpowers/plans/2026-11-07-anonymous-invitations.md

Baseline remoto639cc940124d3c8fd881bdf7f80cba4429393709, stessa copia selettiva e PR1. Richiesta utente: invito a tutti i selezionati e nota piccola come Random Stranger; recuperata dicitura esatta dal precedente accordo. Implementazione in autonomia già autorizzata, nessuna spedizione reale.

- Client completato: contatti manuali, normalizzazione/deduplica, selezione singola e globale, anteprima, conferma con conteggio, facoltà di proseguire senza inviti. Nota12px in selezione e anteprima. Demo solo fittizia, live senza mittente ufficiale esplicitamente indisponibile.
- Controller completato: soli selezionati, nomi locali esclusi dall'API, ordinamento canonico, doppio tap escluso, stesso batch al retry, risposte obsolete scartate al cambio account.
- Backend completato: adapter certificato dall'operatore anonimo/gratuito ma non istanziato, payload ufficiale fisso, invii individuali, stato accepted/failed/unknown, idempotenza e quote atomiche SQLite/D1. Defaultoff, nessun provider operativo o secret creato.
- Revisione indipendente: corretto RED→GREEN un esito ambiguo di adapter risolto con `{}`/undefined, che veniva erroneamente descritto come non inviato. Ora soltanto accepted:false indica rifiuto certo; altrimenti unknown.
- Chiarimento di conservazione: la pulizia7giorni è differita alla prossima prenotazione, non un job periodico. Spec e guida corretti; pulizia periodica/informativa effettiva restano condizioni dell'attivazione reale. Nessun invito operativo rende questo un limite attualmente applicato a contatti reali.
- Verifiche finali:248/248 test generali,11/11 Worker compilato/D1; TypeScript ed export web/iOS/Android exit0. Browser mobile390: seleziona tutti, esclude uno, anteprima e nota12px, simula due inviti, salta e azzera. Zero chiamate API/provider dal percorso demo.
- Salvataggio destinato alla stessa PR1; nessun merge/deploy, nessun cambiamento di fatturazione o tentativo di aggirare blocchi di rete.
