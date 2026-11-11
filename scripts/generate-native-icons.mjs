import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';

const directory=new URL('../assets/brand/',import.meta.url);
const size=1024;
const cream='#FFF5DC';

export async function buildNativeIcons(source){
 const icon=await sharp(source).resize(size,size).flatten({background:cream})
  .removeAlpha().png({palette:true,quality:90}).toBuffer();
 // Keep the complete C2 drawing within Android's central adaptive-icon safe area.
 const tileSize=728;
 const artwork=await sharp(source).resize(tileSize,tileSize).removeAlpha().raw().toBuffer();
 const layer=Buffer.alloc(tileSize*tileSize*4);
 for(let y=0;y<tileSize;y++){
  for(let x=0;x<tileSize;x++){
   const pixel=y*tileSize+x;
   artwork.copy(layer,pixel*4,pixel*3,pixel*3+3);
   const edge=Math.min(x,y,tileSize-1-x,tileSize-1-y);
   layer[pixel*4+3]=Math.min(255,Math.round(edge*255/20));
  }
 }
 const tile=await sharp(layer,{raw:{width:tileSize,height:tileSize,channels:4}}).png().toBuffer();
 const foreground=await sharp({create:{width:size,height:size,channels:4,background:'#00000000'}})
  .composite([{input:tile,gravity:'centre'}]).png({palette:true,quality:90}).toBuffer();
 return {icon,foreground};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const {icon,foreground}=await buildNativeIcons(await readFile(new URL('c2-approved.jpg',directory)));
 await Promise.all([
  writeFile(new URL('icon.png',directory),icon),
  writeFile(new URL('adaptive-foreground.png',directory),foreground),
 ]);
}
