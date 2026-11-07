import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import * as AuthSession from 'expo-auth-session';
import {authenticateWithApple,reauthenticateAndDeleteAppleAccount} from './apple-native-flow.mjs';

WebBrowser.maybeCompleteAuthSession();
const API=(process.env.EXPO_PUBLIC_API_URL||'').replace(/\/$/,'');
const TOKEN_KEY='balotta.session';
export type Provider='google'|'facebook'|'apple';
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
 if(!API) return {google:false,facebook:false,apple:false};
 try {const p=(await api('/api/config')).providers;return {google:p?.google===true,facebook:p?.facebook===true,apple:Platform.OS==='ios'&&p?.apple===true};} catch {return {google:false,facebook:false,apple:false};}
}
export async function getSession():Promise<User|null> {
 if(!API) return null;try{return (await api('/api/session')).user;}catch{return null;}
}
export async function signIn(provider:Provider) {
 const providers=await getProviders();
 if(!providers[provider]) throw new Error('Accesso '+({google:'Google',facebook:'Facebook',apple:'Apple'}[provider])+' in preparazione. Per ora puoi esplorare la demo con dati fittizi.');
 if(provider==='apple'){
  const Apple=await import('expo-apple-authentication');
  if(Platform.OS!=='ios'||!await Apple.isAvailableAsync())throw new Error('Accesso Apple non disponibile su questo dispositivo.');
  try{await authenticateWithApple({createProof:nativeProof,request:api,authorize:(options:{nonce:string;state:string})=>Apple.signInAsync({...options,requestedScopes:[Apple.AppleAuthenticationScope.EMAIL]}),persistSession:(token:string)=>SecureStore.setItemAsync(TOKEN_KEY,token)});}
  catch(error){if((error as {code?:string}).code==='ERR_REQUEST_CANCELED')throw new Error('Accesso annullato. Puoi riprovare quando vuoi.');throw error;}
  return;
 }
 if(Platform.OS==='web') {window.location.assign(API+'/auth/'+provider+'/start');return;}
 const redirectUri=AuthSession.makeRedirectUri({scheme:'facciamobalotta',path:'auth'});
 const {verifier,challenge}=await nativeProof();
 const result=await WebBrowser.openAuthSessionAsync(API+'/auth/'+provider+'/start?platform=native&challenge='+challenge,redirectUri);
 if(result.type!=='success') throw new Error('Accesso annullato. Puoi riprovare quando vuoi.');
 const url=new URL(result.url);
 if(url.protocol!=='facciamobalotta:'||url.hostname!=='auth') throw new Error('Risposta di accesso non valida.');
 const code=url.searchParams.get('code');if(!code) throw new Error('Nessun codice ricevuto.');
 const data=await api('/auth/native/exchange','POST',{code,verifier});await SecureStore.setItemAsync(TOKEN_KEY,data.token);
}
async function nativeProof(){
 const verifier=Array.from(await Crypto.getRandomBytesAsync(48),b=>b.toString(16).padStart(2,'0')).join('');
 const digest=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,verifier,{encoding:Crypto.CryptoEncoding.BASE64});
 return {verifier,challenge:digest.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
}
export async function signOut() {try{await api('/api/logout','POST');}finally{if(Platform.OS!=='web') await SecureStore.deleteItemAsync(TOKEN_KEY);}}
export async function deleteAccount() {
 const {provider}=await api('/api/account/deletion-method');
 if(provider==='apple'){
  if(Platform.OS!=='ios')throw new Error('Conferma la cancellazione dall’app iOS con lo stesso account Apple.');
  const Apple=await import('expo-apple-authentication');
  if(!await Apple.isAvailableAsync())throw new Error('Conferma Apple non disponibile su questo dispositivo.');
  try{await reauthenticateAndDeleteAppleAccount({createProof:nativeProof,request:api,authorize:(options:{nonce:string;state:string})=>Apple.signInAsync({...options,requestedScopes:[Apple.AppleAuthenticationScope.EMAIL]})});}
  catch(error){if((error as {code?:string}).code==='ERR_REQUEST_CANCELED')throw new Error('Cancellazione annullata. Il tuo account è ancora presente.');throw error;}
 }else await api('/api/account','DELETE');
 if(Platform.OS!=='web')await SecureStore.deleteItemAsync(TOKEN_KEY);
}
