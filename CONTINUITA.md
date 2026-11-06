# Facciamo Balotta — punto unico di ripresa

Aggiornato il 6 novembre 2026 (Europe/Rome).
Repository privata canonica: https://github.com/gianpaolobol/facciamo_balotta

## Stato verificato
- La repository contiene codice testuale e docs/RECUPERO_2026-11-06.md, riletto dal remoto in questa sessione.
- Il recupero integrale NON è completato: il checkpoint remoto dichiara immagini e font ancora da trasferire. Il dato size=0 dei metadati GitHub non prova che la repository sia vuota.
- Sorgente locale recuperabile: /workspace/sites/facciamo-balotta, commit 21d9f2d, con modifiche locali al README/.gitignore e originali PNG non tracciati. Non sovrascrivere.
- Copia preparata: /workspace/scratch/03ef64d36ba1/facciamo_balotta. Non è un checkout Git.
- Inventario locale assets: 83 file, 163212520 byte, incluse illustrazioni e font. docs/ASSET_MANIFEST_2026-11-06.json contiene percorsi, dimensioni e SHA-256; non certifica la presenza remota.
- 40 test e TypeScript risultavano superati nella precedente ripresa; non rieseguiti in questa sessione dedicata alla continuità.
- Nessuna diagnosi tecnica del crash ChatGPT: non attribuirlo con certezza alla lunghezza della chat o al trasferimento.

## Coda ordinata
1. Completare il trasferimento di immagini e font nella repository privata, conservando gli originali. Verificare hash e checkout completo prima di dichiararlo concluso.
2. Installare dal checkout remoto completo, eseguire test, typecheck ed export; registrare commit e risultati. Gli export non sono build native firmate.
3. Riprendere la richiesta già approvata: profilo da descrizione, ritratto e fino a cinque immagini degli interessi; conferma e rigenerazione singola. Matching per interessi/intenzioni/disponibilità, senza valutazione estetica.
4. OAuth reale/backend HTTPS e build native restano da configurare; consultare il recupero per i dettagli.

## Regola di lavoro per ogni sessione
- Leggere AGENTS.md, questo file e docs/RECUPERO_2026-11-06.md.
- Confrontare i documenti con file, branch e commit effettivi. La chat è un'interfaccia, non l'unico archivio del lavoro.
- Procedere per blocchi piccoli e coerenti. Dopo ciascun blocco aggiornare questo stato con fatti, decisioni, verifiche, impedimenti e prossima azione concreta.
- Salvare il blocco su GitHub e rileggere il file remoto o verificare il commit remoto prima di dire “salvato”.
- Se il salvataggio fallisce indicare esattamente cosa è solo locale. Non segnare una richiesta come eseguita sulla base di un'intenzione.
- Non inserire chiavi, file .env privati, database, log sensibili o credenziali in Git. Conservare .env.example senza segreti.
- Evitare di riversare in chat immagini in base64, log integrali e interi file; usare riepiloghi e riferimenti ai file.
- Queste sono istruzioni per il lavoro durante una sessione; non costituiscono un servizio automatico di backup o un processo attivo a chat chiusa.

## Ripresa in una nuova chat
Apri la repository privata gianpaolobol/facciamo_balotta. Leggi AGENTS.md, CONTINUITA.md e docs/RECUPERO_2026-11-06.md. Verifica lo stato remoto effettivo e riprendi dal primo punto aperto della coda. Non ricominciare da zero, non dichiarare il trasferimento completo finché immagini e font non sono verificati e conserva le modifiche locali già presenti.

## Avanzamento caricamento per lotti
16/83 file asset salvati su main. Hash Git confrontati con gli originali locali. Elenco verificabile e file pendenti: docs/TRASFERIMENTO_ASSET.json. Proseguire con i file pending senza ricaricare quelli verificati.
