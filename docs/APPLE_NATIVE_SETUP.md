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

## Limiti che bloccano il rilascio
Non implementati in questo incremento: scambio del codice Apple per refresh token, revoca presso Apple quando viene eliminato l'account e gestione delle notifiche di revoca/cambio account con invalidazione sessioni. Occorrerà predisporre questi flussi e i relativi secret in un incremento dedicato prima di attivare Apple per utenti reali. L'eliminazione attuale cancella dati e sessioni Balotta, non revoca l'autorizzazione presso Apple.

Il controllo check:release rimane negativo e riporta questi passaggi. Le prove automatiche usano chiavi RSA generate durante i test e risposte Apple sintetiche: non dimostrano un accesso reale, validità delle capability o conformità di pubblicazione. Nessuna build firmata o richiesta remota Apple/Cloudflare è stata eseguita per questo incremento.

## Fonti primarie
- https://docs.expo.dev/versions/latest/sdk/apple-authentication/
- https://developer.apple.com/documentation/signinwithapple/verifying-a-user
- https://developer.apple.com/documentation/signinwithapple/revoke-tokens
