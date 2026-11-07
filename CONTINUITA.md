# Facciamo Balotta — punto unico di ripresa

Aggiornato il 7 novembre 2026 (Europe/Rome).
Repository privata canonica: https://github.com/gianpaolobol/facciamo_balotta

## Priorità attuale — debug delle interruzioni (7 novembre 2026)
Questo aggiornamento prevale sulla coda storica di recupero riportata sotto.
- Leggere docs/DEBUG_INTERRUZIONI_2026-11-07.md: causa del crash ChatGPT NON accertata; nessun accesso ai log del client iOS o interni ChatGPT.
- Ripetuti nella copia selettiva verificata /workspace/scratch/52db29df5fbb/balotta-runtime-verificato: 40/40 test, typecheck ed export web/iOS/Android, tutti exit 0. Dipendenze esistenti riutilizzate tramite symlink; npm ci non ripetuto. Non sono build native o un checkout integrale dell'archivio.
- L'app richiama 39 asset JPEG/TTF, nessun PNG; hash locali coincidenti con le rispettive voci del manifest di trasferimento remoto. I 28 PNG mancanti riguardano l'archivio originali, non l'esecuzione della demo.
- Non ricominciare il recupero degli originali come prerequisito dello sviluppo. L'utente ha già chiesto di smettere di cercarli e ricreare: conservare la provenienza e lavorare su massimo due immagini per blocco quando richiesto.
- Le ricodifiche PNG da JPEG della sessione precedente sono solo locali: non dichiararle originali recuperati o file salvati su GitHub.
- Verifica successiva completata: copia selettiva con 99 file identici ai blob dell'albero GitHub 25664a1d939a7efbe60a62cde3bfbd102fa898c5, inclusi tutti i 35 file applicativi/test/configurazione richiesti e i 39 asset runtime. Nessun asset runtime mancante. Dettagli: docs/VERIFICA_RUNTIME_2026-11-07.json. Il recupero integrale 55/83 resta incompleto e distinto. Prossima azione: sviluppo approvato, senza ripetere il recupero archivistico.
- Screenshot ricevuto: APICore.ConversationDetailError.DetailError 1. Successivamente l'utente riferisce la chat aperta in Chrome. Usare Chrome per proseguire; non è dimostrata la causa sottostante né una risoluzione permanente. Non ripetere la richiesta dello screenshot già ricevuto.

## Stato verificato (storico)
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
55/83 file asset salvati su main. Hash Git confrontati con gli originali locali e albero remoto riletto dopo ogni lotto. Elenco verificabile e file pendenti: docs/TRASFERIMENTO_ASSET.json.
Trasferimento e verifica checkout completo ancora aperti. Proseguire dai 28 file pending senza ricaricare quelli verificati. Nessun originale modificato.

## Ripresa del 7 novembre 2026 — lotto di 6 originali
- Letti AGENTS.md, CONTINUITA.md, recupero e inventari remoti; main iniziale e00a47c82f057ded061ae1de601a4c0447bccd60.
- I vecchi percorsi locali non sono presenti nel nuovo ambiente. Recuperata dal repository sorgente dell’anteprima una copia al commit 21d9f2d in /workspace/scratch/d3626e7704d9/source-recovery; questo percorso è temporaneo e non è il checkout GitHub canonico.
- Trasferiti alphabet-source.png, lettering-specimen.png e i quattro originali fotografia-fumetti, musica-colli, spiaggia-complicita, tavolate-giochi. Dimensioni e SHA-256 confrontati con l’inventario originario, SHA Git dei blob identici ai byte locali.
- La copia sorgente recuperata contiene tutti i JPEG e il font usati dalla demo, ma non i 31 originali PNG assets/events ancora pendenti. Cercarli tra le immagini originali salvate, verificando SHA-256 e dimensioni prima del trasferimento; non sostituirli con JPEG convertiti o immagini rigenerate.
- Nessun codice applicativo modificato; test, typecheck ed export non rieseguiti in questo lotto. Checkout remoto completo e recupero integrale restano aperti.
- Prossima azione: recuperare i 31 PNG elencati in docs/TRASFERIMENTO_ASSET.json, poi completare verifica checkout e controlli applicativi.

## Ripresa del 7 novembre 2026 — lotto di 3 originali
- Verificato main al commit 577c18b12b6444157b2ad0ce6c7bd85ff1fce614; letti AGENTS.md, continuità, recupero e inventari.
- Recuperati dagli originali salvati chess.png, concert.png e cooking.png. Dimensioni e SHA-256 identici al manifest iniziale; SHA Git dei tre blob confrontati con i byte locali.
- Stato: 55/83 asset trasferiti, 28 PNG ancora pendenti. I vecchi percorsi di scratch non esistono in questo ambiente; tre originali materializzati in /workspace/scratch/cd1199ef16ff/originals.
- Nessuna modifica al codice; test, typecheck, export e checkout integrale non eseguiti in questo lotto.
- Prossima azione: recuperare i 28 PNG ancora elencati in docs/TRASFERIMENTO_ASSET.json, mantenendo lotti piccoli e verifica degli hash, poi verificare checkout e applicazione.

## Recupero originali ripreso da Chrome — lotto 1
- Ritrovati localmente tutti i 28 originali mancanti, SHA-256 identici al manifest originario.
- Primo lotto: cinema.png e climbing.png, byte originali senza conversione.
- Inventario: 57/83 asset; 26 ancora da collegare a main.
- Gli oggetti binari del primo lotto risultavano già disponibili su GitHub: riutilizzati gli SHA originali, evitando un nuovo trasferimento in base64.
- Coda: completare i restanti originali a due per commit e verificare ogni albero remoto.

## Recupero originali — 59/83
- Lotto: community.png, crafts.png. SHA-256 locali identici al manifest originario; blob Git originali riutilizzati senza ricodifica.
- Stato: 59/83; pendenti 24. Verificare l'albero remoto dopo il commit prima del lotto successivo.

## Recupero originali — 61/83
- Lotto: dance.png, football.png. Byte originali, SHA-256 locali identici al manifest originario e SHA blob restituiti da GitHub coincidenti.
- Stato: 61/83, pendenti 22. Nessun JPEG o codice applicativo modificato.

## Recupero originali — 62/83
- Recuperato gardening.png: dimensione e SHA-256 identici al manifest iniziale; SHA Git calcolato sui byte originali.
- Recuperato anche pottery.png localmente e verificato SHA-256, ma il blob non è disponibile su GitHub. Il tentativo di includerlo nell'albero è fallito (422); NON è salvato sul remoto e resta pending.
- Stato inventario: 62/83; 21 originali pendenti. Nessuna modifica al codice.
- Screenshot IMG_0522.jpeg: Unknown error anche su Chrome iPhone; causa non accertata. URL della chat non disponibile dalle fonti accessibili.
- Prossima azione: trasferire il blob originale pottery.png e verificare il salvataggio prima di altre immagini.

## Recupero originali — 63/83, trasferimento ceramica completato
- Trasferiti i byte originali di pottery.png: SHA Git restituito da GitHub 7b1a8beb73e1d3db4c82b34f270de0f5a070d14f, identico al calcolo locale. SHA-256 già verificato contro il manifest iniziale.
- Risolto l'impedimento del blocco precedente; nessuna ricodifica. Inventario 63/83, 20 originali pendenti.
- Nessuna modifica al codice o nuova esecuzione dei test. Proseguire con i restanti originali a coppie.

## Recupero originali — 65/83
- Aggiunti kayaking.png e motorcycling.png: dimensioni e SHA-256 identici al manifest iniziale, SHA Git calcolati sui byte originali e verificati con gli oggetti GitHub.
- Il titolo salvato «Sosta tra amici sull’Appennino.png» corrisponde per hash a motorcycling.png, non a hiking.png: mantenuta la mappatura del manifest senza dedurla dal titolo.
- Inventario: 65/83; 18 originali pendenti. Codice applicativo invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: proseguire con massimo due originali per blocco e verifica remota. Il crash ChatGPT resta senza causa accertata.

## Recupero originali — 67/83
- Aggiunti languages.png e makers.png dagli originali salvati: dimensioni e SHA-256 identici al manifest iniziale. Blob GitHub caricati e SHA Git restituiti identici al calcolo sui byte locali; nessuna ricodifica.
- Inventario: 67/83; 16 originali pendenti. Codice applicativo invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: continuare con massimo due originali per blocco, verificando il commit remoto prima del successivo. Il crash ChatGPT resta senza causa accertata.

## Recupero originali — 69/83
- Aggiunti pets.png e skating.png dagli originali salvati: dimensioni e SHA-256 identici al manifest iniziale; SHA Git verificati con GitHub, nessuna ricodifica.
- Inventario: 69/83; 14 originali pendenti. Codice applicativo invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: proseguire con massimo due originali per blocco e verifica remota. Causa del crash ChatGPT non accertata.

## Recupero originali — 71/83
- Aggiunti yoga.png e wine.png: byte originali locali con SHA-256 identici al manifest iniziale; nessuna ricodifica.
- Inventario: 71/83; 12 originali pendenti. Codice applicativo invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: proseguire con massimo due originali per blocco e verifica remota. Causa del crash ChatGPT non accertata.

## Recupero originali — 73/83
- Trasferiti hiking.png e padel.png: dimensioni e SHA-256 locali identici al manifest iniziale; SHA dei blob restituiti da GitHub identici al calcolo sui byte originali. Nessuna ricodifica.
- Risolto il precedente errore 422 caricando i due blob originali prima della creazione dell'albero.
- Inventario: 73/83; 10 originali pendenti. Codice applicativo invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: proseguire con massimo due originali per blocco e verifica remota. Causa del crash ChatGPT non accertata.

## Recupero originali — 75/83
- Aggiunti photography.png e videogames.png dagli originali salvati: dimensioni e SHA-256 identici al manifest iniziale; SHA Git restituiti da GitHub identici al calcolo locale. Nessuna ricodifica.
- Inventario: 75/83, 8 originali pendenti. Codice applicativo invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: proseguire con massimo due originali per blocco e verifica remota. Causa del crash ChatGPT non accertata.

## Recupero originali — 76/83
- Aggiunto volleyball.png dall’originale salvato Beach volley sulla costa romagnola.png: 3228690 byte e SHA-256 2245a8e45a8499ded12e3c4f51f04cda3b151f3dd0a278b908cd0db741cf5b95 identici al manifest iniziale; SHA Git restituito identico al calcolo locale. Nessuna ricodifica.
- Inventario: 76/83, 7 originali pendenti. Codice invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: continuare con massimo due originali per blocco e verifica remota. Causa del crash ChatGPT non accertata.

## Recupero originali — 78/83
- Aggiunti painting.png e reading.png: dimensioni e SHA-256 locali identici al manifest iniziale; SHA Git calcolati sui byte originali. Nessuna ricodifica.
- Inventario: 78/83, 5 originali pendenti. Codice invariato; test ed export non ripetuti per questo lotto archivistico.
- Prossima azione: running.png e tennis.png, massimo due originali per blocco e verifica remota. Causa del crash ChatGPT non accertata.

## Sviluppo profilo illustrato — bozza isolata del 7 novembre 2026
- Ramo di lavoro: feat/illustrated-profile-draft-20261107. Questa sezione descrive soltanto tale ramo; main e demo non sono stati modificati.
- Aggiunti src/illustrated-profile.mjs e tests/illustrated-profile.test.mjs: descrizione facoltativa del ritratto, massimo cinque descrizioni di interessi distinte, conferma del testo per slot e revisione che invalida soltanto la conferma della descrizione modificata.
- Non sono immagini generate: nessun provider AI, richiesta a pagamento, chiave, persistenza o collegamento UI è stato aggiunto. Conferma del testo e approvazione dell'immagine futura sono concetti separati.
- Verifica locale Node 24.22.1: cinque test nuovi superati. npm test sulla copia testuale selettiva: 38 pass, 4 fail per materiale locale non disponibile: art-catalog (JPEG assenti), lettering (fontkit assente), phone-demo (fixtures.ts non materializzato), profile-scope (React assente). Non è una prova di regressioni né una suite completamente superata.
- Nessun typecheck, export o collaudo nativo eseguito in questo blocco. Il ramo è una bozza, non pronto per merge.
- Prossima azione: completare il checkout eseguibile e le dipendenze, verificare l'intera suite, poi integrare le descrizioni e conferme nella schermata Profile. Il provider AI richiede un passaggio separato e configurazione sicura.

## Sviluppo profilo illustrato — modulo collegato alla schermata, 7 novembre 2026
- Ramo: feat/illustrated-profile-draft-20261107. Aggiunti hook e componente; Profile ora espone una sezione richiudibile con ritratto facoltativo e cinque interessi, massimo 1000 caratteri per campo.
- Conferme del testo indipendenti, invalidate alla modifica del solo campo interessato. Identità fisse degli slot anche dopo cancellazione; duplicati normalizzati rifiutati, senza bloccare campi indipendenti. Errori accanto al campo e accessibilityHint.
- Bozza soltanto in memoria; esclusa dal PUT del profilo. Nessuna persistenza, generazione AI, immagine approvata o rigenerazione implementata. Avviso visibile; demo invita a usare descrizioni inventate.
- Ricostruita copia eseguibile selettiva dal ramo: sorgenti/configurazioni/test e tutti i 39 JPEG/TTF runtime con SHA Git verificati. Archivio PNG escluso da questa verifica, recupero integrale ancora distinto.
- npm ci --ignore-scripts --no-audit --no-fund: 522 pacchetti installati da lockfile. npm test: 54/54, exit 0. npm run typecheck: exit 0. CI=1 npm run export:all: exit 0, bundle web, Android e iOS prodotti. Sono export, non build firmate o test su dispositivi.
- Revisione indipendente eseguita: due rilievi corretti (duplicati estranei bloccanti; errori lontani dal campo), entrambi riprodotti con test falliti e poi superati. Nessun rilievo importante noto lasciato aperto su questo blocco.
- Controllo visivo non completato: Playwright privo di browser, installazione fallita per archivio scaricato non valido. I test del renderer coprono il comportamento del hook, non layout o interazioni native.
- main e anteprima pubblicata non aggiornati. Prima del merge: controllo visivo e integrazione UI/sessioni. Poi persistenza autenticata della bozza e collegamento AI server con credenziali sicure, approvazione delle immagini e rigenerazione singola.

## Sviluppo profilo illustrato — persistenza autenticata e QA web, 7 novembre 2026
- Ramo e PR: feat/illustrated-profile-draft-20261107, PR #1. Nessun merge o aggiornamento dell'anteprima pubblicata eseguito.
- GET/PUT /api/illustrated-profile usa la sessione esistente. Nuova tabella SQLite illustrated_profiles con FK utente e cancellazione a cascata. Scritture condizionate alla versione attesa; una seconda sessione non può sovrascrivere silenziosamente una bozza più recente (409).
- La schermata carica testi/conferme salvati e offre Salva la bozza illustrata. Modifiche disabilitate durante caricamento/salvataggio; errori di rete conservano le modifiche, ricaricamento richiede una seconda conferma quando scarterebbe testi locali. Salvataggio separato dal profilo base. In demo nessun caricamento/salvataggio delle descrizioni.
- Validazione condivisa di sei slot, 1000 caratteri ciascuno, conferme coerenti con il testo; duplicati NFKC/minuscolo vietati tra interessi confermati. Bozze incomplete possono contenere duplicati non confermati.
- Revisione indipendente: corretti due rilievi con test RED-GREEN, limite del payload JSON e duplicati confermati. Verificato e adeguato anche il limite di byte dell'adapter HTTP: 80000 soltanto per PUT /api/illustrated-profile, 16384 sulle altre route. Configurazione reverse proxy documentata in BETA_SETUP.md.
- npm test: 73/73, exit 0. npm run typecheck: exit 0. Export finale da sorgenti correnti con CI=1 npx expo export --platform all --output-dir dist-verify --max-workers 2: exit 0, tre bundle e metadati presenti. Non sono build native firmate.
- Sbloccata la QA web usando Chromium ottenuto da un pacchetto runtime temporaneo (nessuna dipendenza di prodotto aggiunta). Verifica su frontend esportato con API locale reale, SQLite e sessione sintetica; non OAuth reale.
- Browser: superati salvataggio e ricaricamento pagina, ripristino conferme, modifica indipendente, conflitto e preservazione modifiche, ricarica in due passaggi, payload del profilo base separato, errore vicino al campo, reset entrando in demo e assenza di chiamate all'API delle descrizioni in demo. Nessuno scorrimento orizzontale a 390x844 e 1280x900; screenshot ispezionati per QA interna, non pubblicati.
- Regresioni: risposte di caricamento o salvataggio tardive di un account smontato non contaminano il nuovo account. Prove su telefoni fisici e build native ancora da eseguire.
- Prossima azione: integrazione con main dopo confronto con i suoi aggiornamenti, quindi generazione server con provider/credenziali sicuri, risultati versionati, approvazione delle immagini e rigenerazione singola. Nessun provider, chiave API, addebito o generazione personale attivato in questo blocco.

## Generazione AI gratuita — integrazione pronta, attivazione ancora bloccata (7 novembre 2026)
- Scelta su richiesta esplicita dell'utente: Cloudflare Workers AI, modello fisso FLUX.2 Klein4B, per quota gratuita e supporto a immagini di riferimento. Font Balotta Inchiostro invariato; due riferimenti JPEG del progetto ridotti a 448x252 in assets/ai-reference (provenienza nel manifest).
- Implementati adapter multipart server, API private per singolo slot, anteprima/approvazione/scarto/rigenerazione, immagini in SQLite e controlli su sessione, conferma del testo/versione e maggiore età. L'immagine approvata resta conservata durante una rigenerazione fallita.
- Budget persistente e atomico: 50 tentativi complessivi al giorno e 12 per utente, inclusi i fallimenti; account cancellato non azzera il consumo globale. Nessun retry automatico e nessun fallback a pagamento.
- Il provider resta disabilitato senza account/token e CLOUDFLARE_FREE_PLAN_CONFIRMED=true. Tale flag è una dichiarazione dell'operatore, NON una verifica automatica del piano del fornitore: controllare Workers Free sull'account esatto prima di abilitarlo, senza Paid o AI Gateway credits. Non dichiarare gratuità garantita su account Paid.
- Controllo sicuro dell'ambiente: assenti account ID e token Cloudflare. Nessun segreto creato, registrato o pubblicato, nessuna chiamata reale al provider e nessun addebito. Browser Cloudflare fermo sulla pagina di accesso https://dash.cloudflare.com/login, non autenticato.
- Verifiche: 87/87 test, typecheck exit0, export web/iOS/Android in dist-ai-final exit0. Sono export, non build native firmate. Adapter verificato con risposte controllate, non contro API autenticata reale.
- Revisione indipendente: corretti due difetti UI (chiusura durante generazione bloccava il form; prima anteprima non scartabile), riprodotti in browser prima della correzione e poi superati. Lo script scripts/check-profile-images-web.mjs ripete la prova con sessione sintetica e fixture pixel, mai un'immagine generata reale.
- Font esistente e direzione grafica preservati; identità del risultato artistico di un modello diverso NON dimostrata. Riferimenti e prompt sono predisposti, ma occorrono due generazioni reali dopo l'attivazione per valutare somiglianza e qualità. Non usare imagegen/altro provider per simulare una prova Cloudflare.
- Prossimo passaggio concreto: accesso sicuro Cloudflare, verifica Workers Free, collegamento del token al solo server e prova di due immagini. Se l'autenticazione richiede l'utente, completare prima tutto il lavoro autorizzato e chiedere soltanto quel passaggio. Non chiedere chiavi o password in chat.
- Ramo/PR #1 conservati; nessun merge in main o aggiornamento dell'anteprima pubblicata eseguito.

## Esito accesso Cloudflare — 7 novembre 2026
- Dopo la selezione esplicita del metodo Google e dell'account nel flusso sicuro, la verifica ha riportato alla pagina Cloudflare https://dash.cloudflare.com/login con il messaggio visibile «Unable to sign in. Try again or use your email and password.».
- Accesso Cloudflare NON riuscito. Non è stata accertata la causa; non classificarlo come CAPTCHA, blocco bot o disservizio generale. Nessun tentativo aggiuntivo o cambio di metodo effettuato dopo l'errore generico.
- Nessuna credenziale è stata letta o riportata nella chat/documenti. Nessun token Cloudflare creato o collegato, nessun piano verificato/attivato, nessuna generazione reale o addebito. Provider ancora disabilitato.
- Ripresa: risolvere l'accesso Cloudflare attraverso un nuovo passaggio scelto dall'utente, poi verificare Workers Free e configurare il token solo server. Conservare codice/test già salvati; non dichiarare l'AI attiva o la resa artistica validata.
