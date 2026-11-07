import type { ExpoConfig } from 'expo/config';
const projectId=process.env.EXPO_PROJECT_ID;
const config: ExpoConfig = {
 name:'Facciamo Balotta',slug:'facciamo-balotta',version:'0.1.0',scheme:'facciamobalotta',orientation:'portrait',userInterfaceStyle:'light',
 ios:{supportsTablet:true,bundleIdentifier:'it.facciamobalotta.app',usesAppleSignIn:true,infoPlist:{ITSAppUsesNonExemptEncryption:false}},
 android:{package:'it.facciamobalotta.app'},
 web:{bundler:'metro',name:'Facciamo Balotta',shortName:'Balotta',description:'Persone nuove. Passioni comuni. Ci vediamo dal vivo.',themeColor:'#F5F0E8',backgroundColor:'#F5F0E8'},
 plugins:['expo-secure-store','expo-web-browser','expo-apple-authentication',['expo-notifications',{defaultChannel:'updates',enableBackgroundRemoteNotifications:false}]],
 extra:{...(projectId?{eas:{projectId}}:{})},
};
export default config;
