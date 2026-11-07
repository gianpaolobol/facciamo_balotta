import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {Platform} from 'react-native';
import {createNativePushFlow} from './native-push-flow.mjs';
export type PushRequester=(path:string,method?:string,body?:unknown)=>Promise<any>;
const projectId=Constants.easConfig?.projectId||Constants.expoConfig?.extra?.eas?.projectId;
const supported=()=>Device.isDevice&&Constants.executionEnvironment!=='storeClient';
async function notifications(){return import('expo-notifications');}
async function channel(){
 if(Platform.OS==='android'){
  const Notifications=await notifications();
  await Notifications.setNotificationChannelAsync('updates',{name:'Aggiornamenti',importance:Notifications.AndroidImportance.DEFAULT});
 }
}
const flow=createNativePushFlow({
 storage:{get:(key:string)=>SecureStore.getItemAsync(key),set:(key:string,value:string)=>SecureStore.setItemAsync(key,value)},
 createProof:async()=>({installationId:Crypto.randomUUID(),installationSecret:Array.from(await Crypto.getRandomBytesAsync(32),b=>b.toString(16).padStart(2,'0')).join('')}),
 projectId,isSupported:supported,
 getPermission:async()=>supported()?(await notifications()).getPermissionsAsync():{granted:false,canAskAgain:false},
 requestPermission:async()=>{await channel();return (await notifications()).requestPermissionsAsync();},
 getToken:async()=>{
  try{await channel();return (await (await notifications()).getExpoPushTokenAsync({projectId})).data;}
  catch{throw new Error('Registrazione del telefono non disponibile. Verifica la connessione e la configurazione della build, poi riprova.');}
 },
 request:async()=>{throw new Error('Servizio notifiche non collegato.');},
});
export function getNativePushFlow(request:PushRequester){flow.setRequester(request);return flow;}
export async function disableNativePush(request:PushRequester):Promise<void>{flow.setRequester(request);await flow.disable();}
