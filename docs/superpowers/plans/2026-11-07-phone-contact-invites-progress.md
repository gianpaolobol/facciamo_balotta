# Progress — plan: docs/superpowers/plans/2026-11-07-phone-contact-invites.md

Baseline remoto a7e5ff695bd07fda91b20caa44ecdf6fbf1364e3, copia selettiva e PR1 esistenti. Nuova istruzione utente sostituisce i campi manuali con rubrica automatica autorizzata, solo nomi, WhatsApp/SMS/email.

- Adapter nativo/web completati: Expo Contacts legacy, import paginato readonly, supporto consenso limitato, nessun SDK operativo sul web; composer individuali espliciti e risultati veritieri. Nessuna rubrica reale letta o app personale aperta.
- Mapping/UI completati: nomi senza fallback ai recapiti, ricerca locale, multi/tutti, filtro canale, coda deduplicata, anteprima e gesto esplicito per ogni prossimo nome. Nessun limite20 del vecchio servizio server applicato al nuovo flusso personale.
- Nota piccola aggiornata per non promettere anonimato sui canali personali. Nessun numero/email nel pannello o label accessibili; native composer esterno può mostrare il recapito.
- Revisione indipendente: tre problemi importanti di consenso riprodotti e corretti con regressioni RED→GREEN. Composer controlla ora consenso/recapito corrente; scope limitato ridotto riconcilia lista/coda; refresh foreground invalida import pendenti e blocca azioni prima di completare la verifica. Chiamata refresh senza nuovo prompt. Non resta alcun difetto importante segnalato non trattato.
- Permessi introspezione locale: READ_CONTACTS dichiarato, WRITE_CONTACTS con tools:node=remove; descrizione italiana iOS presente. Il codice nativo Expo installato richiede WRITE solo se presente nel manifest.
- Verifiche finali:276/276 test generali,28/28 focalizzati (20adapter+8mapping/controller),11/11 Worker compilato/D1, TypeScript ed export web/iOS/Android exit0. Browser390 prova nomi soltanto, tutti/esclusione di uno, tre canali, nota12px veritiera, simulazione e salto; nessuna chiamata API/provider e nessun campo manuale contatto. Bundle web senza SDK Contacts/SMS/MailComposer.
- Da completare esternamente: URL pubblico ufficiale EXPO_PUBLIC_INVITATION_URL, build native firmate e prove fisiche permessi/composer/ritorno. Link vuoto -> apertura live disabilitata. Nessuna API a pagamento attivata; SMS secondo piano utente.
- Salvataggio destinato alla stessa PR1, nessun merge/deploy o aggiramento dei blocchi esistenti.
