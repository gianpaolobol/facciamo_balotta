async function requestCredential({createProof,request,authorize},start){
 const {verifier,challenge}=await createProof();
 const {attempt,nonce}=await request(start,'POST',{challenge});
 if(typeof attempt!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(attempt)||typeof nonce!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(nonce))throw new Error('Impossibile iniziare l’accesso Apple. Riprova.');
 const credential=await authorize({nonce,state:attempt});
 if(credential?.state!==attempt||typeof credential.identityToken!=='string'||!credential.identityToken||credential.identityToken.length>8000)throw new Error('Risposta Apple non valida. Riprova ad accedere.');
 return {attempt,verifier,credential};
}
export async function authenticateWithApple(options){
 const {attempt,verifier,credential}=await requestCredential(options,'/auth/apple/native/start');
 const data=await options.request('/auth/apple/native/exchange','POST',{attempt,verifier,identityToken:credential.identityToken});
 if(typeof data?.token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(data.token))throw new Error('Sessione non valida. Riprova ad accedere.');
 await options.persistSession(data.token);
}
export async function reauthenticateAndDeleteAppleAccount(options){
 const {attempt,verifier,credential}=await requestCredential(options,'/api/account/apple/start');
 if(typeof credential.authorizationCode!=='string'||!credential.authorizationCode||credential.authorizationCode.length>2048)throw new Error('Apple non ha restituito la conferma necessaria. Riprova.');
 const result=await options.request('/api/account/apple/delete','POST',{attempt,verifier,identityToken:credential.identityToken,authorizationCode:credential.authorizationCode});
 if(result?.ok!==true)throw new Error('Cancellazione non confermata. Il tuo account è ancora presente.');
}
