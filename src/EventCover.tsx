import React from 'react';
import {Image,View,type ViewStyle} from 'react-native';
import {ART} from './artwork';
import {resolveCover,COVER_THEMES} from './art-catalog.mjs';
type Props={category:string;activityType?:string;title?:string;interests?:string[];height?:number;style?:ViewStyle};
export function EventCover({category,activityType,title,interests,height=175,style}:Props) {
 const key=resolveCover({category,activityType,title,interests}) as keyof typeof COVER_THEMES;
 return <View style={[{width:'100%',height,overflow:'hidden',backgroundColor:'#FFF5DC'},style]}><Image source={ART[key]} style={{width:'100%',height}} resizeMode="cover" accessibilityLabel={'Illustrazione: '+COVER_THEMES[key].label}/></View>;
}
