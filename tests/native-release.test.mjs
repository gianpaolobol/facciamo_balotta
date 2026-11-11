import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';

test('the native entry route cannot open fictional preview data', async () => {
 const {demoScene}=await import('../src/demo-routing.mjs');
 assert.equal(demoScene('match','ios'),null);
 assert.equal(demoScene('registration','android'),null);
 assert.equal(demoScene('match','web'),'match');
});

test('the C2 master generates the committed opaque icon and adaptive foreground', async () => {
 const {buildNativeIcons}=await import('../scripts/generate-native-icons.mjs');
 const asset=name=>readFileSync(new URL('../assets/brand/'+name,import.meta.url));
 const {icon,foreground}=await buildNativeIcons(asset('c2-approved.jpg'));
 assert.deepEqual(icon,asset('icon.png'));
 assert.deepEqual(foreground,asset('adaptive-foreground.png'));
 const ios=await sharp(icon).metadata();
 const android=await sharp(foreground).metadata();
 assert.deepEqual([ios.width,ios.height,ios.hasAlpha],[1024,1024,false]);
 assert.deepEqual([android.width,android.height,android.hasAlpha],[1024,1024,true]);
});
