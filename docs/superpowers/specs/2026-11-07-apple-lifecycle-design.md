# Ciclo di vita Apple nella beta disabilitata

Autorizzato sviluppo autonomo. Completare revoca e cancellazione senza conservare refresh token Apple: una cancellazione di un account Apple richiede una nuova autenticazione nativa con nonce/verifier, sullo stesso subject dell'account corrente. Il server scambia il nuovo authorizationCode, verifica anche l'id_token restituito da Apple, revoca il refresh token ricevuto e solo dopo cancella dati/sessioni Balotta. Errori remoti non producono una falsa conferma di eliminazione; l'utente può riprovare. Non si recuperano credenziali da altri progetti.

Apple client secret ES256 generato per dieci minuti da Team ID, Key ID e chiave P8 server. I valori reali restano da configurare; nessuna chiave creata in questo incremento. Le chiamate di token/revoca usano endpoint Apple fissi, timeout e risposte limitate. I token sono temporanei nella richiesta, mai nel database, nella risposta o nei log.

Endpoint notifiche separatamente disabilitato, con JWT Apple firmato, audience esatta, iat entro sette giorni, eventuale exp, jti ed evento. Supportare events oggetto o stringa JSON, timestamp secondi/millisecondi. Registrazione idempotente persistente; revoca blocca sessioni/handoff e impedisce di creare sessioni da token emessi prima dell'evento. Account Apple cancellato: eliminazione locale con quote globali conservate; cambi forwarding aggiornano soltanto lo stato email. Altri provider isolati. Il replay della stessa notifica non chiude una sessione creata dopo nuova autorizzazione.

Conservare APPLE_NATIVE_ENABLED e APPLE_NOTIFICATIONS_ENABLED false finché firma, credenziali, endpoint HTTPS e dispositivi non sono collaudati. Test con firme e risposte sintetiche, nessuna chiamata remota/deploy/spesa. La policy Cloudflare non viene aggirata.

Fonti: https://developer.apple.com/documentation/signinwithapple/processing-changes-for-sign-in-with-apple-accounts ; https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple .
