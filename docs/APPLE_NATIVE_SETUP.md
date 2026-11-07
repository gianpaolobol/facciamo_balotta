# Accesso Apple nativo — stato e configurazione

Predisposto per iOS con expo-apple-authentication compatibile Expo58, plugin e capability usesAppleSignIn. Pulsante ufficiale Apple solo su iOS quando il dispositivo lo supporta e il backend lo dichiara attivo. Android/web continuano con Google/Facebook.

## Autenticazione predisposta
- POST /auth/apple/native/start riceve challenge S256 del telefono e restituisce nonce casuale e identificatore monouso.
- La richiesta Apple usa nonce e state; il client rifiuta uno state diverso e invia il token firmato e il verifier al backend.
- POST /auth/apple/native/exchange consuma il tentativo (massimo cinque minuti), verifica il verifier e il JWT RS256 con le chiavi pubbliche dell'endpoint fisso https://appleid.apple.com/auth/keys. Verifica issuer, audience del bundle, nonce, emissione, scadenza, subject ed email verificata; solo la allowlist beta può ricevere una sessione Balotta.
- La risposta contiene una sessione privata salvata in SecureStore. Token e nome/email dichiarati dal client non sono usati come identità; non viene effettuata una fusione con account Google/Facebook basata sulla sola email. Il nome può essere compilato nel profilo.
- Le chiavi Apple vengono richieste solo durante lo scambio, con limite di tempo/dimensione e senza URL ricavati dal token. Non vengono persistiti token Apple né creati secret Apple per questa verifica locale del JWT.

## Prima dell'attivazione
Lasciare APPLE_NATIVE_ENABLED=false nei file di esempio e nel Worker. APPLE_BUNDLE_ID deve essere it.facciamobalotta.app; OAUTH_ENABLED deve essere true per attivare qualsiasi accesso reale. La configurazione di default non abilita Apple o OAuth.

Servono capability Sign in with Apple sul bundle corretto nell'account sviluppatore, firma/provisioning, backend HTTPS distribuito normalmente e prove su iPhone/iPad con build del progetto. Expo Go può usare identificatori diversi: non allargare l'audience del backend per accettarli.

Con Nascondi la mia email, l'allowlist deve contenere l'indirizzo privato attestato da Apple; un indirizzo digitato nel client non sblocca la beta. La persona può anche scegliere di condividere l'indirizzo invitato. Non si può ricavare l'email Gmail originale da quella relay.

## Cancellazione con revoca predisposta
Il client riconosce il provider con GET /api/account/deletion-method. Per Apple chiede una nuova conferma nativa: POST /api/account/apple/start genera nonce/verifier legati alla sessione corrente; POST /api/account/apple/delete accetta solo lo stesso subject Apple e un authorizationCode nuovo. Il server scambia il codice, verifica anche il token identità restituito e revoca il refresh token prima di eliminare profilo, immagini e sessioni locali. Il percorso DELETE generico rifiuta account Apple, evitando di saltare la revoca.

Il token Apple resta soltanto nella memoria della richiesta: non viene conservato, restituito o registrato. Il client secret ES256 dura dieci minuti ed è generato da APPLE_TEAM_ID, APPLE_KEY_ID e APPLE_PRIVATE_KEY (P8) del solo server. I valori reali vanno inseriti nel gestore dei segreti, mai in Git, nella chat o in EXPO_PUBLIC_. La chiave deve avere la capability corretta per questo bundle. Non sono state create chiavi reali.

Se l'utente annulla o Apple non conferma scambio/revoca, l'account locale resta presente e il messaggio invita a riprovare. Non viene dichiarata completata una cancellazione fallita. Google/Facebook conservano il percorso di cancellazione esistente. Questo percorso non usa un refresh token persistente e richiede una nuova conferma Apple al momento della cancellazione.

## Notifiche Apple predisposte
Registrare https://ORIGIN_REALE/auth/apple/notifications nel Primary App ID corretto dopo avere distribuito e verificato il backend. APPLE_NOTIFICATIONS_ENABLED=false è il default; il ricevitore può essere abilitato indipendentemente dai nuovi login per continuare a trattare revoche durante la sospensione degli accessi.

L'endpoint verifica la firma Apple, issuer e audience esatti, iat entro sette giorni, exp quando presente, jti e tipo/subject/event_time. Accetta events come oggetto o stringa JSON e timestamp in secondi/millisecondi. Le migrazioni 0002_apple_lifecycle.sql e 0003_apple_session_grants.sql aggiungono ledger, stato Apple e tempi delle autorizzazioni: applicare tutte le migrazioni prima di attivare. Ledger idempotente conservato per otto giorni; la soglia di revoca per subject impedisce sessioni e ricreazione dell’identità da richieste precedenti all’evento, anche durante login concorrenti. Identità e sessione sono create nello stesso write atomico; si considera anche l’inizio del tentativo sul server, per non fidarsi di un iat Apple leggermente avanti. La cancellazione locale scrive la stessa soglia nella transazione che elimina l’account, senza attendere notifiche.

consent-revoked invalida le sessioni Apple autorizzate prima dell’evento e gli handoff pendenti, preservando le autorizzazioni più recenti anche quando arriva in ritardo; account-deleted elimina l'account locale e i dati privati; email-enabled/email-disabled aggiornano lo stato forwarding senza disconnettere o modificare account di altri provider. Il ledger rende innocue le ripetizioni dello stesso jti anche dopo una nuova autorizzazione. I consumi globali AI e lo stato minimo di revoca restano separati dall'eliminazione dei dati del profilo. L'app non invia ancora email: prima di aggiungere invii, collegare il mittente allo stato forwarding.

## Limiti che bloccano il rilascio
Codice di revoca e notifiche ora implementato, ma non verificato con Apple reale. Restano registrazione endpoint, secret/capability/firma, round trip di cancellazione e revoche reali, test iPhone/iPad e privacy/moderazione prima dell'attivazione. Il controllo check:release rimane negativo anche se tutte le variabili sono presenti.

Le prove automatiche usano chiavi RSA/EC generate durante i test e risposte Apple sintetiche; non dimostrano accesso reale o conformità di pubblicazione. Nessuna build firmata o richiesta remota Apple/Cloudflare è stata eseguita per questo incremento. Il refresh giornaliero della sessione Apple e i controlli nativi dello stato credenziale possono essere valutati dopo il collaudo del canale notifiche; il server invalida già le sessioni quando riceve l'evento firmato.

## Fonti primarie
- https://docs.expo.dev/versions/latest/sdk/apple-authentication/
- https://developer.apple.com/documentation/signinwithapple/verifying-a-user
- https://developer.apple.com/documentation/signinwithapple/revoke-tokens
- https://developer.apple.com/documentation/signinwithapple/processing-changes-for-sign-in-with-apple-accounts
- https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple
