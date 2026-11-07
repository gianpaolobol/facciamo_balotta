import {readFile} from 'node:fs/promises';
import {MODEL,STYLE_VERSION,buildProfileImagePrompt,imageBytes,failure} from './image-core.mjs';
export {MODEL,buildProfileImagePrompt} from './image-core.mjs';
export function createFreeImageProvider({accountId,token,freePlanConfirmed}={}, {providerFetch=fetch}={}){
 const ready=Boolean(/^[a-f0-9]{32}$/i.test(accountId||'')&&token&&freePlanConfirmed===true);
 return {ready,model:MODEL,accountId,async generate(input){
  if(!ready) throw failure('Generazione in preparazione: manca il collegamento verificato al piano gratuito.');
  const form=new FormData();form.set('prompt',buildProfileImagePrompt(input));form.set('width','1024');form.set('height','1024');
  for(const [index,name] of ['cooking','hiking'].entries())form.set('input_image_'+index,new Blob([await readFile(new URL('../assets/ai-reference/'+name+'.jpg',import.meta.url))],{type:'image/jpeg'}),name+'.jpg');
  let response;
  try{response=await providerFetch('https://api.cloudflare.com/client/v4/accounts/'+accountId+'/ai/run/'+MODEL,{method:'POST',headers:{authorization:'Bearer '+token},body:form,signal:AbortSignal.timeout(60_000),redirect:'error'});}catch{throw failure('Generazione non disponibile. Riprova più tardi.');}
  if(!response.ok)throw failure(response.status===429?'Quota gratuita esaurita o generatore occupato. Riprova più tardi.':'Generazione non disponibile. Riprova più tardi.',response.status===429?429:503);
  // Bound the JSON response before decoding the base64 image.
  let size=0;const chunks=[];for await(const chunk of response.body){size+=chunk.length;if(size>12_000_000)throw failure('Risposta del generatore troppo grande.',502);chunks.push(chunk);}
  let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw failure('Risposta del generatore non valida.',502);}
  if(data.success===false)throw failure('Generazione non disponibile. Riprova più tardi.');
  return {...imageBytes(data.result?.image),model:MODEL,styleVersion:STYLE_VERSION};
 }};
}
