import {readFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
const directory=new URL('../assets/brand/',import.meta.url);
await mkdir(directory,{recursive:true});
const source=await readFile(new URL('icon-source.svg',directory));
await sharp(source).flatten({background:'#FFF5DC'}).removeAlpha().png().toFile(new URL('icon.png',directory).pathname);
// The foreground fits the central adaptive-icon safe area. Android supplies
// the opaque cream background separately; this layer preserves transparency.
const foreground=source.toString().replace('  <rect width="1024" height="1024" fill="#FFF5DC"/>','').replace('<g transform="rotate(-7 512 512)">','<g transform="translate(512 512) scale(.72) translate(-512 -512) rotate(-7 512 512)">');
await sharp(Buffer.from(foreground)).png().toFile(new URL('adaptive-foreground.png',directory).pathname);
console.log('Generated original Brand symbol: opaque1024 icon and adaptive foreground.');
