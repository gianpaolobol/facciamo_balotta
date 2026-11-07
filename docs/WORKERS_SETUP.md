# Backend gestito per iOS e Android

L'app Expo resta un unico client per iOS e Android; GitHub conserva sorgenti e versioni. Il backend può essere eseguito su Workers con database D1, senza mantenere un server dedicato. Il server Node/SQLite resta disponibile per lo sviluppo locale.

## Stato verificato
Worker compilato con Wrangler 4.158.0 in dry-run. Test su Miniflare/D1 locale: persistenza, sessione bearer nativa, handoff PKCE monouso, versioni concorrenti, quote atomiche, immagini private a blocchi e rollback. AI verificata soltanto con una risposta sintetica nel test wrapper. Nessuna chiamata AI reale, database remoto creato, pubblicazione o credenziale attivata.

Il pacchetto Miniflare 5.20261104.0-beta è allineato al runtime della versione Wrangler selezionata; i test usano il convertitore ufficiale delle opzioni v4. Le versioni sono fissate nel lockfile.

## Verifica locale senza account Cloudflare

```sh
npm ci
npm test
npm run test:worker
npm run db:migrate:local
npm run typecheck
npm run export:all
```

Non abilitare binding remoti durante queste prove. `worker:bundle` esegue soltanto deploy --dry-run. Gli export Expo non sono IPA/APK firmati.

## Configurazione nella propria infrastruttura autorizzata

Questi sono passi per il gestore dell'account nel suo ambiente di distribuzione, non un aggiramento della policy di rete dell'ambiente agente:

1. Verificare che l'account sia Workers Free e che database/AI siano nelle quote gratuite. Non attivare Paid, crediti Gateway o servizi accessori a pagamento.
2. Creare un database D1 denominato facciamo-balotta; sostituire in wrangler.jsonc l'ID fittizio con l'ID reale e applicare migrations/0001_backend.sql nell'ambiente di destinazione. L'ID tutto zero non identifica un database pubblicato.
3. Configurare un origin HTTPS reale per il backend e un dominio/route autorizzato. workers_dev e preview_urls sono disabilitati per evitare una pubblicazione involontaria della bozza. Non basta eseguire deploy con la configurazione di esempio.
4. Conservare le credenziali OAuth Google/Meta come secret del Worker; impostare gli ID client, la allowlist beta e le callback HTTPS del backend. Per il client nativo resta lo schema facciamobalotta con handoff monouso/PKCE; Apple nativo, revoca e notifiche sono predisposti ma disabilitati: configurazione reale e collaudo sui telefoni restano da completare (docs/APPLE_NATIVE_SETUP.md).
5. In Workers, AI usa il binding env.AI dell'account: non occorre un token Cloudflare dentro il telefono o nel Worker per ogni inferenza. L'eventuale token di distribuzione resta nello strumento di deployment e non nei sorgenti. Non riutilizzare credenziali di Fungo Italia.
6. Lasciare OAUTH_ENABLED e CLOUDFLARE_FREE_PLAN_CONFIRMED false finché accessi, piano Free e allowlist non sono verificati. Il flag Free è un'attestazione dell'operatore, non un controllo automatico della fatturazione del provider.
7. Dopo la distribuzione, configurare EXPO_PUBLIC_API_URL del client con l'origin HTTPS del backend e produrre build native di sviluppo separate per iOS e Android. Nessun secret deve avere prefisso EXPO_PUBLIC_.

Non è stato preparato un workflow che faccia chiamate a Cloudflare da GitHub per superare il diniego di rete dell'agente. La distribuzione richiede un normale ambiente con accesso autorizzato al servizio.

## Persistenza e limiti

Accesso Apple nativo predisposto e disabilitato per default: leggere docs/APPLE_NATIVE_SETUP.md. JWT, revoca con conferma fresca e notifiche firmate sono implementati localmente; secret, registrazione endpoint e collaudo reale restano prerequisiti di attivazione/rilascio. Non abilitare APPLE_NATIVE_ENABLED durante il solo setup del database.

D1 è asincrono: l'API attende le operazioni anche quando viene usato lo store SQLite locale. Quote, versioni e consumi non sono conservati nella memoria dell'isolate. La prenotazione di una generazione usa un unico INSERT condizionato; le mutazioni delle immagini verificano la versione nel relativo write atomico.

Le immagini sono suddivise in blocchi da 512000 byte per rispettare il limite D1 di 2 MB per riga. Le letture usano un unico snapshot SQL. Trigger transazionali impongono un massimo applicativo di 200 MB per i blocchi immagine: al limite una scrittura fallisce conservando l'immagine approvata. D1 Free ha un limite di 500 MB per singolo database, distinto dai 5 GB complessivi dell'account. Anche metadati, sessioni e record di consumo occupano spazio. Eseguire monitoraggio e prove di carico prima dell'apertura pubblica.

Il timeout del binding AI è di 60 secondi; una risposta tardiva non viene utilizzata e la prenotazione del consumo non viene rimborsata. Restano i limiti di 50 tentativi globali/giorno e 12 per utente. La generazione con FLUX2 Klein4B e i due riferimenti resta da provare realmente, inclusa la somiglianza artistica.

## Fonti primarie
- https://developers.cloudflare.com/d1/worker-api/d1-database/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/

Le migrazioni 0002_apple_lifecycle.sql e 0003_apple_session_grants.sql aggiungono ledger notifiche, soglia revoca Apple e tempi delle autorizzazioni. I test locali applicano tutte le migrazioni in ordine. Le credenziali APPLE_TEAM_ID/APPLE_KEY_ID/APPLE_PRIVATE_KEY sono solo server e non vanno aggiunte ai vars pubblici del progetto. APPLE_NOTIFICATIONS_ENABLED resta false finché l’endpoint non è registrato e collaudato.

## Appuntamenti persistenti predisposti
La migrazione0004_meetings.sql aggiunge candidati e appuntamenti con conferme/versioni atomiche. MEETINGS_ENABLED=false resta il default; leggere docs/MEETINGS_API.md. Il matching che crea candidati e la UI multiutente non sono ancora collegati. Nessuna coppia o prenotazione reale è stata creata.
