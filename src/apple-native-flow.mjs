export async function authenticateWithApple({createProof,request,authorize,persistSession}){
 const {verifier,challenge}=await createProof();
 const {attempt,nonce}=await request('/auth/apple/native/start','POST',{challenge});
 if(typeof attempt!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(attempt)||typeof nonce!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(nonce))throw new Error('Impossibile iniziare l’accesso Apple. Riprova.');
 const credential=await authorize({nonce,state:attempt});
 if(credential?.state!==attempt||typeof credential.identityToken!=='string'||!credential.identityToken||credential.identityToken.length>8000)throw new Error('Risposta Apple non valida. Riprova ad accedere.');
 const data=await request('/auth/apple/native/exchange','POST',{attempt,verifier,identityToken:credential.identityToken});
 if(typeof data?.token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(data.token))throw new Error('Sessione non valida. Riprova ad accedere.');
 await persistSession(data.token);
}
