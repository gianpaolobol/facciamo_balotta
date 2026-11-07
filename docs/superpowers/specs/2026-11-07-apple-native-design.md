# Accesso Apple nativo nella beta iOS

L'utente autorizza lo sviluppo autonomo dell'app iOS/Android. Scelta implementativa: usare expo-apple-authentication su iOS e verificare il token firmato nel backend già condiviso tra Node e Workers; nessun servizio di autenticazione aggiuntivo. Apple web/OAuth browser richiederebbe un Services ID e ulteriori callback: non necessario per questo incremento nativo.

Una richiesta iniziale genera nonce e tentativo monouso, legato al verifier del telefono. Lo scambio verifica RS256 con chiavi scaricate solo dall'endpoint Apple fisso, issuer, audience uguale al bundle iOS, scadenza, emissione, nonce, subject ed email verificata nella allowlist beta. Nome/email dichiarati dal client non autorizzano il login. Identità di provider diversi restano separate.

Funzione disabilitata per default e limitata al bundle it.facciamobalotta.app, con pulsante nativo ufficiale visibile solo su iOS compatibile. Credenziali e token Apple non entrano in Git o log. Sessione Balotta conservata in SecureStore come per gli altri provider. Nessun accesso remoto di prova o piano a pagamento.

Questo incremento non completa il rilascio Apple: restano capability/firma reali, prove su dispositivo, gestione revoche Apple e revoca delle autorizzazioni presso il provider quando si elimina l'account. L'eliminazione locale continua a cancellare dati/sessioni Balotta; non è dichiarata una revoca Apple. La funzione resta disabilitata prima di questi collaudi.

Fonti: https://docs.expo.dev/versions/latest/sdk/apple-authentication/ ; https://developer.apple.com/documentation/signinwithapple/verifying-a-user .
