import {withImageDeadline} from './image-deadline.mjs';
import {MODEL,STYLE_VERSION,buildProfileImagePrompt,imageBytes,failure} from '../server/image-core.mjs';
import cooking from '../assets/ai-reference/cooking.jpg';
import hiking from '../assets/ai-reference/hiking.jpg';
export function createBoundImageProvider(env){
 const ready=Boolean(env.AI&&env.CLOUDFLARE_FREE_PLAN_CONFIRMED==='true');
 return {ready,model:MODEL,accountId:env.CLOUDFLARE_ACCOUNT_ID||'worker-binding',async generate(input){
  if(!ready)throw failure('Generazione gratuita non ancora attivata.');
  const form=new FormData();form.set('prompt',buildProfileImagePrompt(input));form.set('width','1024');form.set('height','1024');
  for(const [index,bytes] of [cooking,hiking].entries())form.set('input_image_'+index,new Blob([bytes],{type:'image/jpeg'}),'reference-'+index+'.jpg');
  const serialized=new Response(form);
  let result;try{result=await withImageDeadline(()=>env.AI.run(MODEL,{multipart:{body:serialized.body,contentType:serialized.headers.get('content-type')}}));}catch{throw failure('Generazione non disponibile. Riprova più tardi.');}
  return {...imageBytes(result?.image),model:MODEL,styleVersion:STYLE_VERSION};
 }};
}
