# Lettering e copertine degli eventi

Correzione richiesta dall'utente il 6 novembre 2026: i font generici non incarnano Pentothal/Frigidaire; i titoli devono avere un font personalizzato oppure lettering come immagini. Anche sport e attività future devono ricevere illustrazioni coerenti con il fumetto già approvato.

## Scelte di implementazione

- Font originale **Balotta Inchiostro**, ricavato da un alfabeto disegnato per il progetto e convertito in contorni vettoriali TrueType. Titoli e marchio mantengono testo selezionabile/accessibile, ridimensionabile e disponibile offline. Comprende maiuscole, minuscole in piccole maiuscole, numeri, accenti e punteggiatura italiana. Non è presentato come font ufficiale delle opere di riferimento.
- Il font è preferito ai titoli come immagini perché funziona immediatamente anche sui titoli inventati dagli utenti. I testi lunghi restano nel font di lettura corrente.
- Nove nuove scene originali nello stesso mondo visivo: arrampicata, calcio, tennis, padel, pallavolo, corsa, yoga, nuoto e socialità generale. Le cinque scene precedenti restano disponibili per bici, colli, mare, musica, cultura, tavolate e giochi.
- Selettore di copertina condiviso da lista, dettaglio, appuntamenti e creazione. Precedenza: attività specifica scelta dall'utente, riconoscimento prudente entro la categoria scelta, copertina della categoria, scena generale. Una nuova attività sconosciuta deve ricevere una copertina coerente e neutra, senza essere raffigurata come uno sport diverso.
- Nel compositore dimostrativo si può scegliere il tipo di attività e vedere la copertina prima di creare l'anteprima locale. Nessuna chiamata AI o spesa per ogni evento, nessuna attivazione del backend o nuova raccolta di dati.

## Verifica

Controllare accenti e numeri nel font reale, leggibilità di titoli lunghi e layout a larghezze mobili. Provare categorie nuove, tipi sconosciuti, tennis/padel, calcio balilla e titoli non sportivi. Ogni tema deve avere un asset disponibile. Eseguire suite, TypeScript, export delle tre piattaforme e controllo visivo prima della nuova pubblicazione privata.
