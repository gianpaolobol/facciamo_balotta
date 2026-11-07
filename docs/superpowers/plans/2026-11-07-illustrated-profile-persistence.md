# Illustrated Profile Persistence Implementation Plan

> For agentic workers: use superpowers:executing-plans to continue this increment.

Goal: conservare testi e conferme del profilo illustrato per l'utente autenticato e ripristinarli al successivo accesso.
Architecture: tabella SQLite con FK utente, endpoint autenticato separato dal profilo base, versioni ottimistiche; hook React con caricamento e salvataggio esplicito. Demo esclusa dalla persistenza.
Tech Stack: Node 24 SQLite, Expo 58 / React Native, React 19, TypeScript, node:test.
Spec: prossimo incremento approvato nella PR #1 e in CONTINUITA.md.

## Vincoli e decisioni
- Ritratti facoltativi, cinque slot stabili per gli interessi, 1000 caratteri per campo.
- Conferme solo del testo; generazione e approvazione delle immagini da implementare separatamente.
- Dati ricavati dalla sessione autenticata, senza accettare un destinatario scelto nel payload.
- PUT con versione attesa; conflitto 409 anziché sovrascrittura silenziosa.
- Caricamento completato prima di abilitare modifiche e salvataggio. Errori di salvataggio preservano i testi locali.
- In demo niente caricamento/salvataggio delle descrizioni; reset sui passaggi tra account e modalità tramite ProfileScope.
- Duplicati ammessi tra bozze incomplete, vietati tra interessi confermati dopo normalizzazione NFKC e minuscolo italiano.
- Limite trasporto e parsing di 80000 byte/caratteri per il solo PUT /api/illustrated-profile, adeguato a sei testi da 1000 caratteri e alle copie delle conferme anche con escape JSON. Limite ordinario 16384 invariato sulle altre route.

## Esecuzione
- [x] API/store: test RED prima della route e della tabella; identità, riapertura DB, conflitti, input, origine/bearer, cancellazione.
- [x] Hook: test RED prima di caricamento/salvataggio; errori, retry, doppio click, risposta tardiva e bozza demo.
- [x] UI: stato di caricamento, pulsante Salva la bozza illustrata, errori e ricaricamento con conferma prima di scartare modifiche.
- [x] Revisione indipendente e correzioni RED-GREEN: payload con escape JSON, duplicati confermati, limite HTTP verificato anche a livello adapter.
- [x] Ulteriori regressioni: caricamento/salvataggio tardivi non contaminano il profilo di un altro account.
- [x] Suite: 73 test superati; TypeScript superato.
- [x] Controllo Chromium desktop e larghezza telefono su frontend esportato e backend reale locale, sessione sintetica. Nessun OAuth reale o dispositivo fisico.

## Controlli browser
Caricamento, conferma indipendente, salvataggio, reload pagina e ripristino; conflitto da seconda sessione con preservazione testi; ricarica in due passaggi; PUT del profilo base separato; errore accanto al campo; passaggio a demo azzera i testi e non chiama l'API delle descrizioni; nessuno scorrimento orizzontale a 390 e 1280 pixel. Screenshot esaminati soltanto per QA interna.

## Prossimo incremento
Generazione server con configurazione sicura del provider, risultati versionati, approvazione dell'immagine e rigenerazione singola. Il ramo resta separato da main e dall'anteprima pubblicata.
