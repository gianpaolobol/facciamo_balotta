# Configurazione beta riservata

## Stato e prerequisiti

Il progetto contiene sorgenti e configurazioni. La disponibilità di account sviluppatore su Fungo Italia non significa che questa nuova app abbia già un progetto Expo, schede store o provider OAuth. Non riutilizzare gli identificativi dell'altra app.

1. La repository privata canonica è `gianpaolobol/facciamo_balotta`; lo sviluppo corrente è nel ramo `feat/illustrated-profile-draft-20261107` e nella PR #1. Non ricreare il progetto.
2. Creare il nuovo progetto Expo/EAS sotto l'account del titolare e registrare il suo UUID come `EXPO_PROJECT_ID`. Gli identificativi proposti `it.facciamobalotta.app` devono essere verificati nei portali prima della registrazione.
3. Per il backend gestito senza server dedicato seguire `docs/WORKERS_SETUP.md` (Worker e D1). Il servizio non è ancora distribuito. In alternativa, per un ambiente Node persistente: pubblicare API Node e database SQLite su un ambiente HTTPS con persistenza e backup, sullo stesso origin del client. Configurare nel reverse proxy un limite per IP client reale, separato per visitatore; il processo Node non deve condividere una quota basata sull’IP loopback del proxy. SQLite non va usato su un filesystem effimero o in repliche che non condividono i dati. L'anteprima statica non esegue questo server.
4. Configurare i client Google e l'app Meta, relativi domini/callback, schermata consenso e modalità test/review appropriate. Callback previste: `/auth/google/callback` e `/auth/facebook/callback` sull'origin effettivo. `FACEBOOK_API_VERSION` va scelta fra le versioni supportate dall'app Meta.
5. Preparare informative, termini, consensi necessari, processo di cancellazione e contatto di supporto prima di raccogliere dati. L'app demo non è un servizio di moderazione, emergenza o verifica documentale dell'identità.
6. Inserire in `BETA_ALLOWED_EMAILS` soltanto gli indirizzi dei tester realmente invitati. L'email è ricevuta e controllata dal provider, non digitata come login nell'app. Gli account Google devono restituire email verificata; senza email disponibile il test non viene abilitato.
7. Per iOS configurare Sign in with Apple e il suo backend prima di distribuire la beta conforme ai requisiti applicabili. La verifica JWT e il flusso nativo sono predisposti e disabilitati: leggere `docs/APPLE_NATIVE_SETUP.md`. Restano capability/firma reali, revoche Apple, notifiche e prove su dispositivi prima dell’attivazione; la sola capability non basta.

## Percorso di collaudo

Provare ogni provider con account autorizzato e non autorizzato, consenso annullato, sessione scaduta, callback ripetuta e cancellazione. Provare web mobile e due dispositivi nativi reali. La suite automatica usa un trasporto provider simulato e database SQLite reali: non equivale al collaudo OAuth con Google o Meta.

Il profilo salvato in questo incremento comprende nome visualizzato, maggiore età dichiarata, provincia e interessi. Foto, disponibilità, preferenze private sentimentali, matching, gruppi reali e chat richiedono ulteriori sviluppi con relative autorizzazioni server.

## TestFlight e Android

- Nuova scheda App Store Connect e credenziali Apple per questa app; configurare l'ascAppId reale dopo creazione. Usare `eas build --platform ios --profile beta`, poi `eas submit --platform ios --profile beta` con configurazione Apple completata.
- Nuova scheda Google Play e credenziali appropriate; usare `eas build --platform android --profile beta`, poi `eas submit --platform android --profile beta`. Il profilo punta al track interno in stato draft.
- Per Android fuori dallo store, il profilo preview prepara un APK firmato da EAS; per iPhone ad hoc servono provisioning e dispositivi registrati. Questi sono percorsi alternativi di test, non build già prodotte.
- Il workflow CI controlla codice ed export. Le build EAS restano esplicite per evitare avvii automatici e consumi non voluti. Usare credenziali nel gestore dei segreti, mai incollarle in chat o nel repository.

## Prima di invitare persone

Eseguire `npm run check:release`; l'esito bloccato è atteso finché mancano i collegamenti. Registrare ricevuta della build, versione/numero, commit, esito del test su iPhone e Android e prova di login. Per utenti esterni alla squadra Apple usare il percorso TestFlight esterno appropriato, senza assegnare privilegi App Store Connect ai semplici tester.

La condivisione della sola anteprima privata richiede la configurazione dei visitatori supportata dall'hosting. Nessun tester è stato invitato e nessuna mail è stata inviata in questa sessione.


## Bozza del profilo illustrato

Il ramo feat/illustrated-profile-draft-20261107 introduce GET/PUT /api/illustrated-profile. Il client usa la stessa configurazione EXPO_PUBLIC_API_URL e le stesse sessioni del profilo base. Il PUT richiede draft e version; un conflitto restituisce 409 e mantiene le modifiche sul client fino a salvataggio o ricaricamento esplicito.

La tabella illustrated_profiles viene creata all'avvio dal normale createStore: user_id è una FK con cancellazione a cascata, data contiene testi/conferme e version aumenta a ogni scrittura. Conservare il database persistente nell'ambiente del server. La demo non usa questo endpoint.

Il reverse proxy deve ammettere almeno 80000 byte per PUT /api/illustrated-profile. L'adapter mantiene tale limite e il limite ordinario di 16384 byte sugli altri endpoint. Testi, conferme e bozza salvata non rappresentano immagini AI generate; il provider non è ancora collegato.

## Generazione immagini: solo quota gratuita Cloudflare

Il server usa FLUX.2 Klein4B tramite Workers AI. Nel Worker si usa il binding AI senza token REST nel codice: seguire docs/WORKERS_SETUP.md. Le indicazioni su token e variabili che seguono riguardano il server Node alternativo. Verificare che l'account sia Workers Free (non Paid e senza AI Gateway credits), poi configurare CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN come segreti del solo server. Il token deve avere Workers AI Read/Edit, limitato all'account del progetto. Non copiarlo in chat, Git, variabili EXPO_PUBLIC_ o URL. Il modello e l'host non sono modificabili dal client.

Lasciare CLOUDFLARE_FREE_PLAN_CONFIRMED=false finché il piano non è stato controllato; tale flag non interroga il piano del provider e non deve essere impostato per un account Paid. In questo stato il codice e la UI restano disponibili ma le generazioni non partono. Il runtime usa le variabili del processo; per un file locale ignorato si può avviare con node --env-file=.env.local server/index.mjs.

Quote applicative: 50 tentativi al giorno complessivi e 12 per utente, prenotati prima della chiamata, inclusi i tentativi falliti. Giorno UTC, condiviso con la quota Cloudflare di 10000 Neurons. Nessun retry o fallback a pagamento. Il consumo è persistente in SQLite: non usare un database effimero o istanze con database separati per lo stesso account Cloudflare.

Le immagini restano private nel database e vengono eliminate con l'account. Sono servite con la sessione applicativa; non occorre storage a pagamento. Approvazione, rigenerazione e scarto delle anteprime sono separati dalla conferma dei testi. I riferimenti in assets/ai-reference sono copie ridotte degli asset cooking/hiking e non nuovi originali recuperati. Il font Balotta Inchiostro resta invariato.

Prima dell'attivazione pubblica: collegamento sicuro del token, conferma del piano Free e due generazioni reali per valutare la somiglianza. Le prove automatiche e browser con fixture non certificano la resa artistica del modello.
