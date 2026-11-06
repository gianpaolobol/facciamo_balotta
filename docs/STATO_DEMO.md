# Stato verificato della prima demo

6 novembre 2026. Progetto distinto da Fungo Italia, con lo stesso stack Expo/React Native e configurazione EAS per distribuzioni separate.

## Eseguito

- Sorgenti condivisi per web, iOS e Android.
- Catalogo ampliato a 39 temi, 38 illustrazioni distinte e 44 interessi selezionabili. Le cinque illustrazioni iniziali: musica sui colli; bici e Riviera; tavolate e giochi; spiaggia e complicità; fotografia e fumetti. Il richiamo esplicito alla struttura dell'Isola delle Rose è stato eliminato.
- Titoli nel font originale Balotta Inchiostro, ricavato dal lettering disegnato approvato; testi Comic Neue e note Kalam. Icone originali tracciate a mano e bordi irregolari nei pulsanti.
- Anteprima con dati fittizi: filtri per provincia/interesse, richieste di gruppo, approvazione, proposta persona, interesse reciproco simulato, doppia conferma e cambio di data.
- API OAuth Google/Facebook e profili privati preparati e testati con trasporto provider simulato; accessi disabilitati senza configurazione reale.
- 40 test automatici superati; controllo TypeScript superato; export Metro per web, iOS e Android superato. L'ambiente npm segnala una configurazione proxy deprecata; i test di stato React usano react-test-renderer, che emette un avviso di deprecazione.
- Controllo nel browser del percorso dimostrativo a due: prima conferma, seconda conferma e azzeramento dopo cambio data; controllo dell'approvazione del partecipante di gruppo.
- Revisione indipendente del codice: due problemi importanti trovati e corretti con test che prima fallivano e poi passavano. Stato del profilo isolato fra account/demo; rimosso il limite globale che penalizzava tutti i visitatori dietro un proxy. Il limite per client è un requisito esplicito della configurazione del reverse proxy prima della pubblicazione del backend.
- Piano di promozione fisica regionale predisposto; nessuna distribuzione o spesa effettuata.

## Da completare prima dell'accesso reale dei tester

- Nuovo progetto Expo, repository GitHub privata dedicata e schede store.
- Backend HTTPS persistente collegato, credenziali Google/Meta, URL di callback e impostazioni dei provider.
- Implementazione e collaudo del login Apple per iOS.
- Informative, consensi e moderazione adatti al servizio; nominativi dei tester e allowlist autorizzata.
- Firma e build IPA/APK/AAB, ricevute TestFlight/Google Play e collaudo su iPhone e Android reali.
- Attività e gruppi multiutente reali, disponibilità, chat, notifiche e suggerimenti IA. Gli esempi locali non equivalgono a queste funzionalità attive.

`npm run check:release` restituisce intenzionalmente esito bloccato finché questi prerequisiti non sono risolti. Gli export di bundle non sono build native firmate. Nessun invito è stato inviato e nessuna registrazione reale è stata attivata.

## Percorso su telefono

`/phone-preview.html` offre quattro scene illustrative: registrazione, ingresso, persona proposta e appuntamento. La proposta consente accettazione, rifiuto e altra persona fittizia. Due interessi reciproci precedono la proposta di attività; due disponibilità confermano la stessa versione dell’appuntamento. Cambiare data annulla le conferme. Le query di anteprima non abilitano accesso reale.

Prima del matching reale: normalizzare gli alias degli interessi; ritratti generativi e schede personali degli interessi sono una nuova richiesta, ancora da collegare e da attivare con credenziale API autorizzata. Nessuna generazione personalizzata attiva in questa versione.
