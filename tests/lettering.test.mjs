import test from 'node:test';import assert from 'node:assert/strict';import {existsSync,readFileSync} from 'node:fs';
import * as fontkit from 'fontkit';
const path=new URL('../assets/fonts/BalottaInchiostro.ttf',import.meta.url);
test('the bundled custom font renders Italian user-created titles without missing glyphs',()=>{
 assert.ok(existsSync(path),'The original Balotta display font must be bundled');
 const font=fontkit.create(readFileSync(path));
 const title='È già una bella balotta! Perché sì: arrampicata · calcio · tennis — 18:30, 20 €.';
 for(const ch of title) assert.ok(font.hasGlyphForCodePoint(ch.codePointAt(0)),`Missing ${ch}`);
 assert.ok(font.layout(title).glyphs.every(g=>g.id!==0));
 assert.ok(font.layout('ARRAMPICATA').advanceWidth>0);
});
test('display glyphs have useful contours and distinct digits',()=>{
 assert.ok(existsSync(path),'The original Balotta display font must be bundled');
 const font=fontkit.create(readFileSync(path));
 for(const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ÀÈÉÌÒÙ') assert.ok(font.glyphForCodePoint(ch.codePointAt(0)).path.commands.length>3,`Empty glyph ${ch}`);
 assert.notEqual(font.glyphForCodePoint(48).id,font.glyphForCodePoint(79).id);
});
