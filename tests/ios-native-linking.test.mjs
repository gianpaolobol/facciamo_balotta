import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

test('Apple native modules compile together and keep startup modules linked',()=>{
 const result=JSON.parse(execFileSync(process.execPath,['node_modules/expo-modules-autolinking/bin/expo-modules-autolinking','resolve','--platform','apple','--json'],{encoding:'utf8'}));
 assert.deepEqual(result.configuration?.buildFromSource,['.*'],'Expo native modules must use one compatible source build');
 for(const name of ['expo-modules-core','expo-font','expo-contacts','expo-secure-store','expo-web-browser']){
  assert.ok(result.modules.some(module=>module.packageName===name),name+' must remain linked');
 }
});
