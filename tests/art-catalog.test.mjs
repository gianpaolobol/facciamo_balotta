import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveCover,choicesForCategory,COVER_THEMES} from '../src/art-catalog.mjs';
test('a selected sport takes precedence over incidental words in its title',()=>{
 assert.equal(resolveCover({category:'Sport',activityType:'climbing',title:'Prima il tennis, poi si sale'}),'climbing');
 assert.equal(resolveCover({category:'Sport',activityType:'padel',title:'Tennis e padel'}),'padel');
});
test('climbing, football, tennis and padel have their own covers',()=>{
 for(const [title,key] of [['Boulder per principianti','climbing'],['Calcetto fra amici','football'],['Una partita a tennis','tennis'],['Proviamo il padel','padel']]) assert.equal(resolveCover({category:'Sport',title}),key);
});
test('table football and table tennis never receive a football or tennis illustration',()=>{
 assert.equal(resolveCover({category:'Giochi',title:'Torneo di calcio balilla'}),'table');
 assert.equal(resolveCover({category:'Sport',title:'Calcio balilla al circolo'}),'table');
 assert.equal(resolveCover({category:'Sport',title:'Tennis da tavolo'}),'community');
});
test('beach tennis uses its beach cover rather than the clay tennis court',()=>{
 assert.equal(resolveCover({category:'Sport',title:'Beach tennis al mare'}),'beach');
});
test('an unfamiliar sport or category gets a neutral illustration rather than climbing',()=>{
 assert.equal(resolveCover({category:'Sport',title:'Badminton al parco'}),'community');
 assert.equal(resolveCover({category:'Una nuova categoria',title:'Laboratorio di aquiloni'}),'community');
 assert.equal(resolveCover({category:'Sport',activityType:'unknown',title:'Attività nuova'}),'community');
});
test('explicit non-sport categories cannot be overruled by incidental sport words',()=>{
 assert.equal(resolveCover({category:'Cultura',title:'Fotografiamo la partita di calcio'}),'photography');
 assert.equal(resolveCover({category:'Musica',title:'Corsa alle prime file'}),'music');
 assert.equal(resolveCover({category:'A tavola',activityType:'football',title:'Cena dopo il calcio'}),'table');
});
test('personal interests cannot turn a football event into basketball or a restaurant lunch into a cooking class',()=>{
 assert.equal(resolveCover({category:'Sport',title:'Calcio con gli amici',interests:['Basket']}),'football');
 assert.equal(resolveCover({category:'A tavola',title:'Pranzo al ristorante',interests:['Cucina']}),'table');
});
test('wellness yoga and a sporting walk use their known covers',()=>{
 assert.equal(resolveCover({category:'Benessere',title:'Yoga al parco'}),'yoga');
 assert.equal(resolveCover({category:'Sport',title:'Camminata sportiva'}),'running');
});
test('category choices expose valid themes and accented text is recognized',()=>{
 const sports=choicesForCategory('Sport');assert.ok(sports.some(x=>x.key==='tennis'));assert.ok(sports.some(x=>x.key==='padel'));
 assert.equal(resolveCover({category:'SPORT',title:'Còrsa tranquilla'}),'running');
 assert.equal(resolveCover({category:'All’aperto',title:'Giro in bici'}),'bikes');
 for(const choice of sports) assert.ok(COVER_THEMES[choice.key]);
});
test('every theme points to an available encoded production illustration',()=>{
 for(const theme of Object.values(COVER_THEMES)){
  const bytes=readFileSync(new URL('../'+theme.file,import.meta.url));
  assert.equal(bytes[0],255);assert.equal(bytes[1],216);assert.ok(bytes.length>1000);
 }
});
