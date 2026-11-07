import {useEffect,useState} from 'react';
import {View} from 'react-native';
import * as Apple from 'expo-apple-authentication';
export function AppleSignInButton({enabled,busy,onPress}:{enabled:boolean;busy:boolean;onPress:()=>void}){
 const [available,setAvailable]=useState(false);
 useEffect(()=>{let live=true;Apple.isAvailableAsync().then(value=>{if(live)setAvailable(value);}).catch(()=>{});return ()=>{live=false;};},[]);
 if(!enabled||!available)return null;
 return <View pointerEvents={busy?'none':'auto'} accessibilityState={{disabled:busy,busy}} style={{opacity:busy?.55:1}}><Apple.AppleAuthenticationButton buttonType={Apple.AppleAuthenticationButtonType.CONTINUE} buttonStyle={Apple.AppleAuthenticationButtonStyle.BLACK} cornerRadius={10} style={{width:'100%',height:48}} onPress={()=>{if(!busy)onPress();}}/></View>;
}
