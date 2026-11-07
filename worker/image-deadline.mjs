export const IMAGE_TIMEOUT_MS=60000;
export async function withImageDeadline(task,milliseconds=IMAGE_TIMEOUT_MS){
 let timer;try{return await Promise.race([Promise.resolve().then(task),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error('Generazione scaduta.'),{status:503})),milliseconds);})]);}finally{clearTimeout(timer);}
}
