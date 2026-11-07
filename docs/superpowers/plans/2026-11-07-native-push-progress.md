# Progress — plan: docs/superpowers/plans/2026-11-07-native-push.md

Baseline remoto4226d62e402b04acbe164f89fc743d552aa6c638; copia selettiva esistente, non un checkout Git. Modifiche condivise integrate dalla radice, moduli backend/client implementati in ambiti separati. Nessun deploy o provider reale.

- Task1 complete: schema/query condivisi SQLite/D1, route/prova/cifratura, quote/dispatcher/ricevute. Test iniziali17/17 compresa integrazione.
- Task2 complete: client nativo e web noop, consenso esplicito, cancellazione dei flussi obsoleti, revoca pendente persistita;16/16 test.
- Task3: integrati store/HTTP/config/Worker scheduled senza cron, panel/logout, dipendenze Expo compatibili e release gate.
- Revisione indipendente: due problemi riprodotti con SQLite reale locale e provider simulato. Sessione scaduta durante ricevute: check usava ora iniziale. Coda: LIMIT50 prima della visibilità poteva affamare indefinitamente altre persone. Entrambi trattati come importanti e corretti in una sola passata con test osservati fallire, poi passare. Nessun minore rinviato.
- Fix scadenza: dispatcher rilegge il tempo corrente dopo attese e prima di prenotare/autorizzare; un timestamp esplicito resta disponibile per le simulazioni deterministiche già presenti.
- Fix coda: predicato di visibilità condiviso con inbox applicato nel SQL prima del limite50; verifica ulteriore anche nel Worker/D1 compilato.
- Verifica finale: `npm test`230/230, `npm run test:worker`10/10, `npm run typecheck`exit0, `npm run export:all -- --output-dir dist-push-final`exit0. Test e provider sintetici; nessuna build firmata o consegna a dispositivi provata.
- Salvataggio: codice/documenti destinati allo stesso ramo della PR1, main invariato; rilettura remota richiesta prima di annunciare il completamento del blocco.
