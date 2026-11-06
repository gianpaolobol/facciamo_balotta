# Balotta Inchiostro

Font originale del progetto: 36 glifi di base disegnati per questo alfabeto, vettorializzati in TrueType, con punteggiatura e segni diacritici aggiunti come contorni originali. Non deriva dai file di un font commerciale e non viene presentato come un font ufficiale di Pentothal o Frigidaire.

`alphabet-source.png` conserva l'alfabeto sorgente; `glyph-manifest.json` documenta i caratteri e le aree di provenienza; `lettering-specimen.png` mostra un campione renderizzato con il TTF effettivo. Il testo resta testo nelle tre versioni dell'app.

Per rigenerare, in un ambiente di authoring con fontTools, Pillow, NumPy e SciPy:

```sh
python3 scripts/build_display_font.py assets/fonts/alphabet-source.png assets/fonts/BalottaInchiostro.ttf
```

I test Node con fontkit verificano direttamente il font distribuito, senza richiedere la rigenerazione durante il build Expo.
