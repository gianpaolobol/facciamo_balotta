# Avvisi nativi facoltativi

Estensione della casella interna per iOS/Android tramite Expo Push. Il servizio Expo Push non ha un costo di invio: [FAQ ufficiali](https://docs.expo.dev/push-notifications/faq/). Account Apple/Google, distribuzione e infrastruttura vanno verificati separatamente; nessun piano a pagamento viene abilitato dal codice.

## Stato

Codice predisposto, `PUSH_ENABLED=false`, nessun cron configurato, nessuna richiesta al provider eseguita e nessuna build firmata/collaudo fisico. Le credenziali APNs/FCM ed Expo enhanced push security restano esterne. Gli export Expo e i test con token sintetici non provano la consegna a un telefono.

## Consenso e privacy

Il pulsante personale «Attiva gli avvisi» richiede esplicitamente il permesso su un dispositivo fisico in una build appropriata; non compare nel web. Nessun permesso o acquisizione token all'avvio. Il client conserva una prova d'installazione in SecureStore, usa un projectId EAS reale e annulla il flusso se cambia account o si abbandona la schermata prima del completamento. Un consenso stabilito resta valido navigando nelle altre sezioni. La revoca non confermata viene conservata per riprovare alla connessione successiva.

Payload fisso: titolo `Facciamo Balotta`, testo `Hai nuovi aggiornamenti nell’app.`, dati `{screen:'updates'}`, TTL300 secondi e canale Android `updates`. Nessun testo della chat, nome, conteggio, ID personale/gruppo/coppia, immagine o descrizione. Il tap apre normalmente l'app: non legge messaggi né seleziona un vecchio account. I contenuti richiedono le API e la sessione attuale. Un invio già accettato dal provider non può essere ritirato; rimane generico.

Sul server il token è cifrato AES256GCM con IV casuale e chiave esterna; il segreto di prova è hashato. Le risposte non restituiscono token, cifrati o hash. Le registrazioni dipendono dalla sessione tramite FK cascade: logout riuscito, revoca Apple o cancellazione account le rimuovono. Un errore di rete durante logout non impedisce la rimozione della sessione locale; la revoca pendente viene riprovata. Non vengono registrati token o errori grezzi del provider.

## API

| Metodo | Percorso | Corpo / risposta |
|---|---|---|
| GET | `/api/push/device` | Sessione corrente: `{enabled:boolean}` |
| POST | `/api/push/device` | `{installationId,installationSecret,token,projectId}`; risposta `{ok:true}` |
| POST | `/auth/push/disable` | `{installationId,installationSecret}`; risposta generica `{ok:true}` anche se assente |

ID UUID, segreto64hex; registrazione solo per una sessione valida e un profilo maggiorenne idoneo. L'API autenticata conserva il controllo origine/cookie e supporta bearer nativo. La revoca senza sessione richiede la prova privata e rifiuta origini esplicite diverse. Stessa installazione e prova possono trasferire il consenso; token già associati a un'altra installazione non possono essere acquisiti da un nuovo ID. Massimo5 registrazioni/account.

## Configurazione esterna

1. Applicare `0010_push.sql` dopo `0009_notifications.sql` nel database autorizzato. Node applica `PUSH_SCHEMA` dopo lo schema delle notifiche.
2. Il progetto EAS reale Balotta è collegato in `config/distribution.mjs`; usare lo stesso UUID per `PUSH_PROJECT_ID` sul server.
3. Configurare credenziali APNs/FCM per i bundle `it.facciamobalotta.app` e abilitare enhanced push security nel progetto Expo.
4. Conservare `PUSH_ENCRYPTION_KEY` (64hex casuali) ed `EXPO_ACCESS_TOKEN` soltanto nel secret manager server. Nessun segreto nelle variabili `EXPO_PUBLIC_`, nel client o in Git. La rotazione della chiave richiede una migrazione dei cifrati oppure la revoca delle registrazioni e un nuovo consenso.
5. Collaudare build firmate iOS/Android: rifiuto/consenso, cambio account, logout/revoca, arrivo generico, tap e ricevute. Solo dopo impostare `PUSH_ENABLED=true` e configurare deliberatamente un trigger `scheduled` nell'ambiente autorizzato. Il repository non installa cron o workflow di invio.

`pushReady` controlla flag, UUID progetto, formato chiave e presenza access token. Non certifica credenziali valide, enhanced security attiva o consegna fisica. La release resta bloccata anche quando le variabili sono presenti, finché non esistono le prove reali richieste. Il codice non supera blocchi di rete o fatturazione e non usa altri progetti come ponte.

## Trasporto limitato e ricevute

Il dispatcher usa solo gli endpoint HTTPS Expo fissi, senza redirect e con timeout10 secondi. Prenota atomicamente un tentativo SQL prima del trasporto; ricontrolla idoneità/sessione e visibilità corrente della notifica. Invia solo per nuovi aggiornamenti non letti successivi al consenso. Leggere, bloccare, abbandonare un gruppo o revocare la sessione può annullare l'invio ancora da iniziare.

Limiti:100 tentativi globali/giorno UTC,20/installazione/giorno, almeno5minuti tra tentativi, massimo5 nuovi invii ed esame di5 ricevute per esecuzione. La selezione dispositivi è limitata a50 candidati. Un ticket/claim ancora pendente impedisce ulteriori invii per l'installazione. I fallimenti contano nelle quote; rimuovere dispositivo/account non azzera il ledger, che conserva soltanto hash d'installazione/versione e stato per7giorni. Il cursore avanza al claim per evitare duplicazioni: un errore di rete può perdere l'avviso push, mentre l'aggiornamento resta nella casella interna. Nessuna garanzia di consegna o retry dello stesso avviso.

Un ticket valido significa accettazione Expo. Dopo15minuti viene richiesta la ricevuta; `receipt_ok` significa accettazione da APNs/FCM, non prova di arrivo/lettura sul telefono. Ricevute mancanti vengono ricontrollate e scadono dopo24ore. `DeviceNotRegistered` rimuove solo la versione interessata, senza revocare registrazioni rinnovate nel frattempo. Una nuova acquisizione token richiede l'azione esplicita di attivazione; non esiste rinnovo silenzioso del consenso.

## Verifiche ripetibili

`node --test tests/push*.test.mjs tests/native-push-flow.test.mjs`, `npm test`, `npm run test:worker`, `npm run typecheck`, `npm run export:all`. Provider e permessi sono iniettati nei test; il test Worker usa Miniflare/D1 reale locale con token sintetici. Non sono richieste credenziali operative.
