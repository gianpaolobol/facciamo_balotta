import React from 'react';
import {InkIcon,InkFrame,type InkName} from './InkIcon';
import { Pressable, Text, View, StyleSheet, type ViewStyle } from 'react-native';
export const C={paper:'#FFF5DC',ink:'#252923',muted:'#666452',red:'#D44935',lime:'#D9E885',line:'#292C25',white:'#FFFCF3',violet:'#DBCBF0'};
export function Button({label,onPress,secondary=false,disabled=false,style,icon}:{label:string;onPress:()=>void;secondary?:boolean;disabled?:boolean;style?:ViewStyle;icon?:InkName}) {
 return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[s.button,secondary?s.secondary:null,disabled?{opacity:.55}:null,pressed?{transform:[{translateY:2}],boxShadow:'0px 1px 0px #252923'}:null,style]}><InkFrame/>{icon?<InkIcon name={icon} color={secondary?C.ink:C.paper} size={25}/>:null}<Text style={[s.buttonText,secondary?{color:C.ink}:null]}>{label}</Text></Pressable>;
}
export function Chip({label,active=false,onPress}:{label:string;active?:boolean;onPress?:()=>void}) {
 return <Pressable accessibilityRole="button" accessibilityState={{selected:active}} onPress={onPress} style={[s.chip,active?{backgroundColor:C.ink,borderColor:C.ink}:null]}><Text style={{fontSize:13,fontWeight:'600',color:active?C.white:C.ink}}>{label}</Text></Pressable>;
}
export function Avatar({name,size=32,color=C.violet}:{name:string;size?:number;color?:string}) {
 return <View style={{width:size,height:size,borderRadius:size/2,backgroundColor:color,borderWidth:2,borderColor:C.white,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:size*.35,color:C.ink,fontWeight:'700'}}>{name.slice(0,1).toUpperCase()}</Text></View>;
}
export function Brand({small=false}:{small?:boolean}) {
 return <View style={{flexDirection:'row',alignItems:'center',gap:9}}><View style={{width:small?34:42,height:small?34:42,borderRadius:10,borderWidth:2,backgroundColor:C.red,alignItems:'center',justifyContent:'center',transform:[{rotate:'-7deg'}]}}><View style={{flexDirection:'row',gap:3}}>{[1,2,3].map(i=><View key={i} style={{width:6,height:6,borderRadius:3,backgroundColor:C.paper,marginTop:i===2?5:0}}/>)}</View></View><View style={{transform:[{rotate:'-2deg'}]}}><Text style={{fontFamily:'BalottaInchiostro',fontSize:small?16:18,lineHeight:small?16:18,color:C.ink}}>facciamo</Text><Text style={{fontFamily:'BalottaInchiostro',fontSize:small?34:40,lineHeight:small?38:45,letterSpacing:.2,color:C.ink}}>BALOTTA<Text style={{color:C.red}}>!</Text></Text></View></View>;
}
export const s=StyleSheet.create({
 button:{flexDirection:'row',gap:8,backgroundColor:C.red,paddingHorizontal:23,paddingVertical:15,borderTopLeftRadius:10,borderTopRightRadius:15,borderBottomLeftRadius:14,borderBottomRightRadius:8,borderWidth:1,borderColor:C.ink,boxShadow:'3px 4px 0px #252923',alignItems:'center',justifyContent:'center'},buttonText:{color:C.white,fontSize:15,fontFamily:'ComicNeue_700Bold'},secondary:{backgroundColor:C.paper},
 chip:{borderWidth:1.5,borderColor:C.line,borderRadius:100,paddingHorizontal:16,paddingVertical:10,backgroundColor:'transparent'},
 eyebrow:{fontSize:15,fontFamily:'BalottaInchiostro',letterSpacing:1.5,color:C.red,textTransform:'uppercase'},title:{fontSize:38,lineHeight:45,fontFamily:'BalottaInchiostro',letterSpacing:.3,color:C.ink},body:{fontSize:15,lineHeight:23,color:C.muted,fontFamily:'ComicNeue_400Regular'},card:{backgroundColor:C.white,borderRadius:19,borderWidth:2,borderColor:C.line,overflow:'hidden'},
 label:{fontSize:13,fontWeight:'700',color:C.ink,marginBottom:8},input:{borderWidth:1,borderColor:C.line,borderRadius:12,padding:14,fontSize:16,color:C.ink,backgroundColor:C.white},
});
