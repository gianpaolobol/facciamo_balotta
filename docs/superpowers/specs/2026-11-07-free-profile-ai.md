# Generazione gratuita per Facciamo Balotta

Richiesta dell'utente: scegliere autonomamente un'API gratuita, conservando l'aspetto delle immagini approvate e gli stessi caratteri del progetto.

## Scelta
Cloudflare Workers AI con @cf/black-forest-labs/flux-2-klein-4b, modello fisso e richieste multipart. Il modello supporta riferimenti visivi: due copertine già approvate del progetto vengono ridotte a 448x252, entro il limite documentato di 512x512. La tipografia resta il TTF esistente Balotta Inchiostro, senza rigenerazione o sostituzione.

Alternative considerate: FLUX.1 Schnell offre text-to-image ma non i riferimenti dello stesso flusso; Pollinations oggi richiede chiavi e Pollen e non costituisce una garanzia generale di uso gratuito. Il modello scelto permette riferimenti e una quota gratuita giornaliera documentata.

## Gratuità
La documentazione Cloudflare indica 10000 Neurons gratuiti al giorno sul piano Workers Free, con blocco oltre quota. Il piano Paid può fatturare eccedenze e non soddisfa il requisito. Attivare solo dopo aver verificato Workers Free sull'account esatto, senza upgrade o AI Gateway credits. CLOUDFLARE_FREE_PLAN_CONFIRMED è un'attestazione dell'operatore, non una verifica automatica del piano Cloudflare.

L'app limita ulteriormente a 50 tentativi totali al giorno e 12 per utente, conteggiando anche i fallimenti e conservando il consumo globale quando si cancella un account. Le prenotazioni sono atomiche in SQLite. Nessun retry automatico, modello alternativo o provider a pagamento. Con due riferimenti sotto 512px e output1024x1024 il limite applicativo è conservativo rispetto alla quota documentata; altri utilizzi dell'account condividono comunque la quota del provider.

## Risultato visivo
I riferimenti e il prompt fissano inchiostro nero spontaneo, volti espressivi, carta crema e palette del progetto. Si può mantenere esattamente il font esistente, ma un modello diverso non garantisce immagini identiche. La qualità e la somiglianza devono essere valutate su due generazioni reali dopo l'attivazione gratuita. Nessuna generazione reale è stata effettuata in questo blocco.

## Flusso
Descrizione confermata e salvata → generazione del singolo slot → anteprima privata → approvazione dell'immagine o rigenerazione. Un'immagine già approvata resta conservata durante la rigenerazione e se il provider fallisce; una prima anteprima può essere scartata. Testo e immagini hanno approvazioni separate. Una risposta tardiva non si collega a descrizioni cambiate. Maggiore età e sessione richieste per la generazione; ogni immagine appartiene all'utente autenticato. Nessun testo del profilo in URL o nelle richieste dal client al provider.

## Stato di attivazione
Integrazione implementata e testata con risposte controllate, senza addebiti. Nessun token Cloudflare presente nell'ambiente; il browser Cloudflare mostra la pagina di accesso. Connessione reale, verifica Workers Free e prova di somiglianza sono ancora bloccate sull'autenticazione. Non pubblicare la funzione come operativa finché questi passi non sono completati.

## Fonti primarie consultate il 7 novembre 2026
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/
- https://developers.cloudflare.com/changelog/post/2026-01-15-flux-2-klein-4b-workers-ai/
- https://developers.cloudflare.com/workers-ai/get-started/rest-api/
