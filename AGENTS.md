# Istruzioni di continuità — Facciamo Balotta

<!-- inizio-protocollo-comune -->
## [Gian] Protocollo comune — gestito dalla sincronizzazione, non modificare

Questo repository fa parte della piattaforma di Gian Paolo Franceschini.

1. **Leggi prima `LINEE_GUIDA.md`** (nella radice): struttura, regole e protocollo validi per tutti i progetti. Poi questo file, comprese le deroghe `[Gian]`, poi `STATO.md`.
   Poi il **giro di controllo** (cap. 8 delle linee guida): leggi l'ultimo diario del registro e la mappa dei collegamenti, e riusa ciò che esiste già in altri repository.
2. **Firma tutto ciò che aggiungi:** `[Codex]`, `[Claude]`, `[Gemini]`, `[Copilot]`, `[Gian]`.
3. **Questo file si aggiunge, non si riscrive:** nuova sezione `## [Firma] Titolo — AAAA-MM-GG`; per superarne una scrivi una `Rettifica`.
4. **Aggiorna `STATO.md`** nella stessa pull request del lavoro.
5. **Deroghe** alle linee guida: solo Gian, in una sezione `## [Gian] Deroghe alle linee guida` di questo file.
<!-- fine-protocollo-comune -->


Prima di lavorare leggere CONTINUITA.md e docs/RECUPERO_2026-11-06.md.
La repository gianpaolobol/facciamo_balotta è il riferimento del progetto. L’utente l’ha resa pubblica l’8 novembre 2026; non ripristinare la visibilità privata senza richiesta.
Confrontare sempre lo stato documentato con branch, commit e file reali.

Dopo ogni blocco coerente di lavoro:
1. Aggiornare CONTINUITA.md con completato, verifiche effettive, richieste pendenti e prossima azione.
2. Registrare e salvare su remoto codice/documenti/asset del blocco, senza sovrascrivere lavoro altrui.
3. Verificare il salvataggio remoto prima di dichiararlo riuscito.
4. Se il blocco è incompleto o solo locale, scriverlo esplicitamente.

Non affidare alla sola cronologia della chat decisioni, stato e istruzioni ancora da eseguire.
Non ripetere recuperi già documentati quando i relativi file sono disponibili.
Non dichiarare build native o integrazioni reali sulla base di export o provider simulati.
Non inserire segreti in Git. Mantenere aggiornato l'inventario degli asset quando vengono trasferiti.
Usare riepiloghi brevi in chat e riferimenti ai file per evitare output inutilmente voluminosi.
Queste istruzioni non impediscono crash di ChatGPT e non attivano processi a chat chiusa.

## Priorità dopo il debug del 7 novembre 2026
Leggere la priorità corrente in CONTINUITA.md e docs/DEBUG_INTERRUZIONI_2026-11-07.md.
Gli originali PNG mancanti sono un problema archivistico separato: non bloccare test, export e sviluppo dell'app che usa JPEG/TTF.
Non ripetere la ricerca storica o la ricreazione dei PNG a ogni ripresa. L'utente ha già chiesto di interrompere la ricerca e ricreare: per attività sulle immagini lavorare su massimo due immagini per blocco, conservare la provenienza e verificare il salvataggio prima del blocco successivo.
Se il salvataggio remoto fallisce, fermare il blocco e indicare cosa è solo locale prima di aggiungere altro lavoro.
Non attribuire i crash ChatGPT a immagini, lunghezza della chat o memoria senza log che lo dimostrino. Test ed export riusciti non provano la risoluzione dei crash della chat.
