import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();
const API=(process.env.EXPO_PUBLIC_API_URL||'').replace(/\/$/,'');
const TOKEN_KEY='balotta.session';
export type Provider='google'|'facebook';
export type User={id:string;name:string;email:string};
export type Profile={name:string;adult:boolean;city:string;interests:string[]};
export const backendConfigured=Boolean(API);
export async function api(path:string,method='GET',body?:unknown) {
 if(!API) throw new Error('Gli accessi reali non sono ancora collegati. Puoi esplorare la demo illustrativa.');
 const token=Platform.OS==='web'?null:await SecureStore.getItemAsync(TOKEN_KEY);
 const response=await fetch(API+path,{method,credentials:'include',headers:{...(body?{'content-type':'application/json'}:{}),...(token?{authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json().catch(()=>({error:'Il servizio non è disponibile.'}));
 if(!response.ok) throw new Error(data.error||'Operazione non disponibile.');return data;
}
export async function getProviders():Promise<Record<Provider,boolean>> {
 if(!API) return {google:false,facebook:false};
 try {return (await api('/api/config')).providers;} catch {return {google:false,facebook:false};}
}
export async function getSession():Promise<User|null> {
 if(!API) return null;try{return (await api('/api/session')).user;}catch{return null;}
}
export async function signIn(provider:Provider) {
 const providers=await getProviders();
 if(!providers[provider]) throw new Error('Accesso '+(provider==='google'?'Google':'Facebook')+' in preparazione. Per ora puoi esplorare la demo con dati fittizi.');
 if(Platform.OS==='web') {window.location.assign(API+'/auth/'+provider+'/start');return;}
 const redirectUri=AuthSession.makeRedirectUri({scheme:'facciamobalotta',path:'auth'});
 const verifier=Array.from(await Crypto.getRandomBytesAsync(48),b=>b.toString(16).padStart(2,'0')).join('');
 const digest=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,verifier,{encoding:Crypto.CryptoEncoding.BASE64});
 const challenge=digest.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 const result=await WebBrowser.openAuthSessionAsync(API+'/auth/'+provider+'/start?platform=native&challenge='+challenge,redirectUri);
 if(result.type!=='success') throw new Error('Accesso annullato. Puoi riprovare quando vuoi.');
 const url=new URL(result.url);
 if(url.protocol!=='facciamobalotta:'||url.hostname!=='auth') throw new Error('Risposta di accesso non valida.');
 const code=url.searchParams.get('code');if(!code) throw new Error('Nessun codice ricevuto.');
 const data=await api('/auth/native/exchange','POST',{code,verifier});await SecureStore.setItemAsync(TOKEN_KEY,data.token);
}
export async function signOut() {try{await api('/api/logout','POST');}finally{if(Platform.OS!=='web') await SecureStore.deleteItemAsync(TOKEN_KEY);}}
export async function deleteAccount() {await api('/api/account','DELETE');if(Platform.OS!=='web') await SecureStore.deleteItemAsync(TOKEN_KEY);}
