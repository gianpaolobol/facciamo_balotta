# Appuntamenti multiutente persistenti

Sviluppo autonomo autorizzato, mantenendo le regole recuperate: una proposta di persona, interesse reciproco, poi appuntamento con due conferme sulla stessa versione; qualsiasi modifica azzera i sì. Il ritratto non viene valutato.

Incremento: API e persistenza Node/D1, disabilitate per default. Le coppie candidate sono create soltanto dal servizio interno (matching da completare), mai scegliendo un ID utente nel payload pubblico. I due membri maggiorenni dichiarati possono esprimere interesse/passare; solo due sì consentono un appuntamento. Le decisioni iniziali sono monouso/idempotenti; una rinuncia nasconde la coppia. Ogni coppia ha al massimo un appuntamento in questo incremento.

Appuntamento: attività, data ISO con timezone nel futuro entro180giorni, luogo dichiarato pubblico e costo esplicito. Una proposta nasce senza conferme. Uno dei due può modificare con versione attesa: versione+1 e conferme azzerate. Le conferme concorrenti della stessa versione si sommano; revisione concorrente obsoleta restituisce409. Entrambi possono annullare: stato terminale, versione+1, conferme azzerate. Partecipanti e appartenenza non sono modificabili dal client.

Ogni lettura/scrittura richiede sessione e appartenenza. Nessuna email, token, profilo di terzi o bozza illustrata nel risultato. Nessuna coppia/invito reale viene creato durante lo sviluppo; test usano utenti sintetici. Nessun invio messaggi, pagamento, prenotazione, deploy o servizio a consumo. Liste limitate a50. Eliminazione account cancella coppie/appuntamenti con cascata.

La UI demo resta invariata. Matching automatico, UI multiutente, chat/notifiche/moderazione e prove reali seguiranno: API predisposta non equivale a servizio attivo.
