import React from 'react';
import {View,Text,Image} from 'react-native';
import {ART} from './artwork';
import {C} from './ui';
export function HeroArtwork({desktop,height}:{desktop:boolean;height:number}) {
 return <View style={{width:desktop?'54%':'100%',padding:desktop?8:0,paddingBottom:18}}><View style={{borderWidth:2.5,borderRadius:18,overflow:'hidden',transform:[{rotate:'2deg'}],boxShadow:'7px 8px 0px #252923'}}><Image source={ART.hills} style={{width:'100%',height}} resizeMode="cover" accessibilityLabel="Illustrazione originale di amici tra portici, colli e Riviera romagnola"/></View><View style={{position:'absolute',bottom:0,left:desktop?18:7,maxWidth:'94%',backgroundColor:C.white,borderWidth:2,paddingHorizontal:14,paddingVertical:7,borderRadius:7,transform:[{rotate:'-4deg'}]}}><Text style={{fontFamily:'BalottaInchiostro',fontSize:desktop?23:20,lineHeight:desktop?29:25}}>Dai portici agli ombrelloni. Insieme.</Text></View></View>;
}
