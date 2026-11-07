# Debug interruzioni Facciamo Balotta — 7 novembre 2026

## Esito e limiti
La causa tecnica del blocco delle chat ChatGPT non è accertata. Non sono disponibili stack trace del client iOS, identificativi delle richieste fallite o log interni ChatGPT. Non attribuire il crash alla dimensione della conversazione o alle immagini senza queste prove. Non dichiarare risolto il crash ChatGPT.

È invece verificato un problema di continuità: il checkpoint remoto rimette il recupero archivistico davanti allo sviluppo, mentre in una cartella temporanea esistono ricostruzioni non salvate sul remoto. Questo favorisce ripetizioni, senza provare la causa delle interruzioni.

## Verifiche eseguite in questa sessione
Copia esistente: /workspace/scratch/752ef5edfb9c/facciamo_balotta. Non è un checkout Git completo verificato da remoto.

- npm test: exit 0, 40 test, 40 superati, 0 fallimenti.
- npm run typecheck: exit 0.
- npm run export:all: exit 0, bundle web/iOS/Android esportati. Non sono build native firmate né collaudi su dispositivi.
- Esaminati App.tsx e src/artwork.ts locali e letti gli stessi riferimenti sul remoto: le illustrazioni richiamate sono JPEG e il font è TTF.
- Scansione require degli asset in App.tsx e nei sorgenti TS/TSX: 39 file distinti, nessun PNG, 30.628.108 byte. Tutti gli hash Git locali coincidono con le corrispondenti voci di docs/TRASFERIMENTO_ASSET.json, riletto dal remoto. Non è una nuova verifica byte per byte di tutti i blob remoti.
- Manifest remoto: 55/83 asset registrati, 28 originali PNG ancora pendenti. Gli originali pendenti totalizzano 97.170.247 byte secondo il manifest originario.
- Copie PNG ricodificate da JPEG e relativo script esistono nella cartella temporanea sopra; non sono recuperi degli originali e non sono dichiarate salvate in GitHub.
- Log errori Worker dell'anteprima appgprj_6aee27992c0c81919047a007679f8e1f nelle ultime 24 ore: nessun evento restituito. Una risposta vuota non esclude errori browser/client, traffico assente o limiti della raccolta.

## Correzione operativa
1. La mancanza degli originali PNG non blocca i controlli o lo sviluppo dell'app, che usa JPEG/TTF. Il recupero integrale dell'archivio resta aperto.
2. Non riprendere automaticamente la ricerca o rigenerazione dei 28 PNG a ogni chat. L'utente ha già chiesto di interrompere la ricerca e ricreare; applicare quella scelta quando si lavora sulle immagini, preservando la provenienza.
3. Per richieste di immagini, massimo due immagini per blocco, come richiesto dall'utente. Verificare e salvare quel blocco prima del successivo. Non inviare base64 nei messaggi o riversare interi log.
4. Per codice e documenti: un blocco coerente, salvataggio remoto e rilettura, poi il successivo. Se il salvataggio fallisce non avviare altro lavoro e registrare cosa rimane locale.
5. Nella ripresa verificare il punto corrente di CONTINUITA.md. Evitare una nuova ricerca storica se i file necessari sono disponibili.
6. Per isolare il blocco ChatGPT serve il testo esatto dell'errore e sapere se si chiude l'app iOS o se resta aperta mostrando una conversazione non continuabile. Confrontare la stessa chat su chatgpt.com permette di raccogliere un'ulteriore osservazione; non garantisce una soluzione.
7. Non sono stati modificati codice applicativo, accesso pubblico, credenziali o immagini in questa sessione.

## Prossima azione
Verificare il checkout remoto dei sorgenti e dei soli asset usati a runtime, poi riprendere lo sviluppo approvato. Non anteporre a questo lavoro il recupero archivistico dei PNG. Per la diagnosi del blocco ChatGPT raccogliere errore esatto e orario Europe/Rome, senza riaprire trasferimenti massivi.

Riferimento ufficiale consultato: https://learn.chatgpt.com/docs/reference/troubleshooting (stati bloccati e raccolta log). Non è una diagnosi specifica di questo incidente.
