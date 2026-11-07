import {readdir,readFile} from 'node:fs/promises';import {resolve,relative} from 'node:path';import {createHash} from 'node:crypto';
const root=resolve(new URL('..',import.meta.url).pathname),archive=resolve(process.argv[2]||'');
if(!process.argv[2]||archive===root)throw Error('Provide the separate local EAS archive directory.');
async function files(directory){const result=[];for(const entry of await readdir(directory,{withFileTypes:true})){const path=resolve(directory,entry.name);if(entry.isDirectory())result.push(...await files(path));else if(entry.isFile())result.push(path);}return result;}
const required=['App.tsx','index.ts','app.config.ts','package.json','package-lock.json','tsconfig.json','eas.json'];
for(const dir of ['src','config','assets'])for(const path of await files(resolve(root,dir)))required.push(relative(root,path));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const path of required){const actual=await readFile(resolve(archive,path)).catch(()=>{throw Error('Missing native source/asset: '+path);});if(hash(actual)!==hash(await readFile(resolve(root,path))))throw Error('Archive mismatch: '+path);}
const copied=(await files(archive)).map(p=>relative(archive,p));
const denied=copied.filter(p=>/^(?:dist[^/]*|node_modules|server|worker|docs|tests|\.git)(?:\/|$)/.test(p)||/(^|\/)\.env(?:[./]|$)/.test(p)||/(?:\.sqlite(?:[.-].*)?|\.p8|\.p12|\.jks|\.keystore|\.log)$/.test(p)||/(^|\/)credentials\.json$/.test(p));
if(denied.length)throw Error('Unexpected private/generated files in archive: '+denied.join(', '));
console.log(JSON.stringify({requiredFilesVerified:required.length,archiveFiles:copied.length,generatedExportsOrCredentials:denied.length}));
