import type { ExpoConfig } from 'expo/config';
import {EAS_PROJECT_ID,EAS_OWNER} from './config/distribution.mjs';
const projectId=EAS_PROJECT_ID;
const config: ExpoConfig = {
 name:'Facciamo Balotta',slug:'facciamo-balotta',owner:EAS_OWNER,version:'0.1.0',scheme:'facciamobalotta',orientation:'portrait',userInterfaceStyle:'light',icon:'./assets/brand/icon.png',
 ios:{supportsTablet:true,bundleIdentifier:'it.facciamobalotta.app',appleTeamId:'BX9MDXAHKG',usesAppleSignIn:true,infoPlist:{ITSAppUsesNonExemptEncryption:false}},
 android:{package:'it.facciamobalotta.app',adaptiveIcon:{foregroundImage:'./assets/brand/adaptive-foreground.png',backgroundColor:'#FFF5DC'},blockedPermissions:['android.permission.WRITE_CONTACTS']},
 web:{bundler:'metro',name:'Facciamo Balotta',shortName:'Balotta',description:'Persone nuove. Passioni comuni. Ci vediamo dal vivo.',themeColor:'#F5F0E8',backgroundColor:'#F5F0E8'},
 plugins:['expo-secure-store','expo-web-browser','expo-apple-authentication',['expo-contacts',{contactsPermission:'Consenti a Facciamo Balotta di leggere i contatti per preparare gli inviti. La rubrica resta sul telefono.'}],['expo-notifications',{defaultChannel:'updates',enableBackgroundRemoteNotifications:false}]],
 extra:{...(projectId?{eas:{projectId}}:{})},
};
export default config;
