# Inviti dalla rubrica, solo nomi

La richiesta aggiornata sostituisce l'inserimento manuale: sul telefono leggere i contatti dopo il consenso di sistema, mostrare solo i nomi nell'elenco e nelle etichette accessibili; numeri/email servono esclusivamente al recapito interno e non devono diventare fallback del nome. Nessuna rubrica trasmessa al backend o persistita, nessuna lettura al semplice avvio.

Approccio scelto in autonomia: adattatore nativo Expo Contacts read-only e composer personali WhatsApp, SMS, email. Web spiega che la rubrica è disponibile dall'app nativa; demo usa nomi fittizi senza accessi o invii. Il precedente adapter ufficiale anonimo rimane separato/spento e non viene usato da questo flusso.

WhatsApp apre la chat precompilata di un destinatario tramite link ufficiale wa.me. SMS/email aprono il composer di sistema di un solo destinatario. Tutti i contatti selezionati formano una coda, ma ogni apertura richiede un gesto esplicito e l'utente conferma l'invio nel canale personale: nessun invio automatico o gruppo che riveli gli altri recapiti. Mostrare avanzamento come aperture/esiti composer, non consegne. Annullo/errore consente retry o salto esplicito; doppio tap non apre due volte.

Nota piccola aggiornata e veritiera: `L’invito non include il tuo profilo Balotta. WhatsApp, SMS ed email mostrano il mittente.` Gli SMS dipendono dal piano telefonico. Nessuna attivazione di API o piano a pagamento.

Contatto locale `{id,name,phones:string[],emails:string[]}`. Import read-only paginato con supporto consenso iOS limitato; contatti senza nome esclusi. Numeri italiani locali convertiti +39 (app Emilia-Romagna), internazionali preservati; recapiti validati e deduplicati, primo recapito valido per canale. Omonimi distinti con ID interno, nessun numero/email mostrato. Canale scelto prima della selezione, solo contatti compatibili selezionabili, cambio canale azzera selezione/coda. Coda deduplica recapiti condivisi. Nessun dato rubrica nei log/errori. Nome e ricerca solo locali; nessun limite20 del precedente canale server applicato alla coda personale; tutto/togli tutto tra i nomi filtrati visibili.

Guardia epoch su permesso/import/composer per cambio account/smontaggio. Rientro in foreground verifica permesso senza richiederlo e, se revocato, svuota dati e coda. Un composer già aperto non è ritirabile. URL invito HTTPS pubblico configurato con EXPO_PUBLIC_INVITATION_URL; nessun valore inventato in assenza del link reale. Senza URL, anteprima/selezione funzionano ma apertura live disabilitata.

Verifica con dipendenze iniettate/contatti sintetici, TypeScript/export nativo e browser demo; nessuna rubrica reale, app esterna o messaggio realmente aperti/spediti in questa sessione. Credenziali native/build/telefoni restano prerequisiti esterni.
