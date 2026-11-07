# Inviti dalla rubrica — direzione corrente

La richiesta aggiornata dell'utente prevale sul precedente flusso manuale anonimo: contatti del telefono, solo nomi nell'elenco, canali WhatsApp, messaggio SMS ed email. Implementazione nella stessa PR1; nessuna build firmata, rubrica reale o canale personale è stato collaudato/aperto da questa sessione.

## Comportamento

Nel profilo nativo `Scegli dalla rubrica` chiede il consenso di sistema dopo un gesto esplicito e carica i nomi autorizzati. Non legge la rubrica all'avvio e non offre più campi manuali per nome/numero/email. Elenco, ricerca ed etichette accessibili mostrano solo i nomi; nessun numero o email viene usato come fallback per un contatto senza nome. Omonimi restano distinti tramite ID locale, senza mostrare recapiti.

Scegliendo WhatsApp/Messaggio/Email compaiono i contatti compatibili; il cambio canale azzera selezione e coda. Selezione multipla e `Seleziona tutti` si applicano ai risultati della ricerca corrente. I nomi già scelti fuori dalla ricerca restano selezionati. Numeri locali italiani assumono +39, coerentemente con la beta Emilia-Romagna; numeri internazionali restano invariati. Per un contatto con più recapiti si usa il primo valido del canale. Recapiti condivisi vengono deduplicati nella coda, evitando aperture duplicate.

L'anteprima contiene soltanto testo dell'app e link pubblico d'installazione. `Invita tutti i selezionati` prepara una sequenza: apre il primo composer, poi l'utente torna nell'app e prosegue esplicitamente al nome successivo. Ogni destinatario è separato dagli altri. Nessun invio automatico in background, nessun gruppo SMS/email e nessuna dichiarazione di consegna. Annullamento ed errore consentono retry o salto esplicito. WhatsApp segnala soltanto apertura, Android SMS può restituire esito sconosciuto e una bozza email non equivale a invio.

## Nota piccola e costi

La nota12px in elenco e anteprima è ora: **«L’invito non include il tuo profilo Balotta. WhatsApp, SMS ed email mostrano il mittente.»** La precedente promessa d'invito anonimo non viene mostrata su questi canali personali. Gli SMS seguono il piano telefonico dell'utente; non viene attivata alcuna API, servizio o abbonamento a pagamento.

L'elenco interno all'app nasconde recapiti, ma il composer esterno può mostrare numero/email per consentire all'utente di verificare il destinatario. È il canale personale a gestire l'invio e il mittente visibile. Nessun nome, profilo Balotta, ID personale/referral o metadato di matching viene incluso automaticamente nel testo dell'invito.

## Dati e autorizzazioni

Lettura paginata read-only dei soli campi nome/telefono/email; nessuna rubrica caricata sul backend, persistita dall'app o inclusa nei log. Android: READ_CONTACTS, WRITE_CONTACTS rimosso dal manifest; iOS: descrizione del permesso dedicata e accesso limitato rispettato. Campi/SDK supportati verificati nei pacchetti Expo58 installati. Uso di `expo-contacts/legacy`: i vecchi metodi importati dal namespace principale SDK58 lancerebbero un errore runtime.

Cambio account/smontaggio invalida permessi/importazioni/composer ancora in preparazione. A ogni ritorno in foreground, dopo la prima richiesta rubrica, viene riletta la lista autorizzata senza nuove richieste di permesso. Durante il controllo i nomi/coda sono nascosti e le azioni bloccate; un vecchio import in volo è invalidato. Riduzione dell'accesso limitato rimuove i nomi non più autorizzati e invalida la coda se un destinatario non è più disponibile. Prima di ogni apertura l'adattatore ricontrolla la rubrica corrente e la presenza del recapito. Un composer già aperto non può essere ritirato dall'app.

La demo usa solo nomi fittizi, senza leggere il telefono o aprire canali. Nel web live compare la spiegazione che la rubrica richiede l'app nativa; nessun SDK contatti viene incluso nel bundle web.

## Configurazione e prove mancanti

Impostare `EXPO_PUBLIC_INVITATION_URL` al link pubblico ufficiale HTTPS prima della build. Nessun URL di installazione viene inventato: senza valore valido il pannello consente selezione/anteprima ma non apre il canale live. Servono una nuova build con plugin/permessi e prove fisiche iOS/Android su consenso limitato/revoca, WhatsApp presente/assente, disponibilità SMS/mail, annullo/ritorno alla sequenza. Export e test sintetici non sostituiscono queste prove.

Il precedente endpoint `/api/invitations` e il ledger0011 sono conservati come servizio ufficiale separato, spento e senza provider. Non ricevono la rubrica e non sono chiamati da questo pannello. I loro limiti20/50 al giorno non si applicano alla sequenza di composer personali. La pulizia differita del vecchio ledger e gli altri vincoli restano documentati nei precedenti spec/plan, che sono storici rispetto alla nuova UI.

Riferimenti: [Expo Contacts](https://docs.expo.dev/versions/latest/sdk/contacts/), [SMS](https://docs.expo.dev/versions/latest/sdk/sms/), [MailComposer](https://docs.expo.dev/versions/latest/sdk/mail-composer/), [WhatsApp click to chat](https://faq.whatsapp.com/5913398998672934/).
