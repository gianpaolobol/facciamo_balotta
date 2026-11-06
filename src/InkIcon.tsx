import React from 'react';
import Svg,{Path,Circle,G} from 'react-native-svg';
export type InkName='discover'|'pair'|'group'|'person'|'heart'|'pass'|'arrow'|'plus';
/** Original pen-drawn marks. Asymmetric paths deliberately keep a human rhythm. */
export function InkIcon({name,size=28,color='#252923'}:{name:InkName;size?:number;color?:string}) {
 return <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><G fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
  {name==='discover'?<><Path d="M16 12 Q28 6 35 18 Q41 29 29 35 Q17 40 11 28 Q7 20 16 12Z"/><Path d="M18 20 l1 2 M29 18 l1 2 M19 28 q6 5 12-2 M22 4 l-1 4 M37 7 l-3 5 M42 23 l-4 1 M38 39 l-4-4 M21 44 l1-5 M6 36 l5-3 M2 18 l6 2 M9 6 l4 6"/></>:null}
  {name==='heart'?<><Path d="M24 40 C20 35 5 25 7 14 C8 4 20 4 24 15 C29 3 41 6 42 16 C44 25 31 36 24 40Z"/><Path d="M11 12 q-2 6 2 10 M34 11 l2 2 M5 4 l4 3 M43 4 l-3 4"/></>:null}
  {name==='pass'?<><Path d="M10 8 Q20 20 38 39 M37 9 Q23 24 9 39" strokeWidth={2.7}/><Path d="M7 10 l5 2 M37 35 l3 7 M10 35 l-3 5 M35 11 l5-3" strokeWidth={1}/></>:null}
  {name==='arrow'?<><Path d="M6 34 Q17 12 39 20 M28 8 q5 6 12 12 q-9 4-14 11"/><Path d="M8 36 l2-6 M35 17 l5 4" strokeWidth={1}/></>:null}
  {name==='plus'?<><Path d="M24 7 Q22 21 25 41 M7 25 Q22 22 41 24" strokeWidth={2.4}/><Path d="M26 8 l-1 5 M8 27 l9-2" strokeWidth={.9}/></>:null}
  {name==='person'?<><Path d="M14 18 Q9 12 15 8 Q13 3 21 5 Q26 0 30 6 Q38 3 37 12 Q43 14 37 20 L34 31 Q26 40 17 31 L14 18Z"/><Path d="M17 19 l3-1 M30 18 l3 1 M25 20 l-2 7 5-1 M21 31 q6 3 10-1 M13 38 q-8 1-9 8 M33 38 q8 1 10 8 M18 36 l6 7 7-7"/></>:null}
  {name==='pair'?<><Path d="M10 15 q-3-7 5-8 q8-3 10 6 l-2 11 q-7 8-13 0Z M28 16 q-2-8 5-8 q9-1 9 8 l-1 10 q-8 7-12-1Z M5 40 q2-12 13-10 q8 1 9 10 M28 40 q0-10 9-10 q7 1 8 10 M13 16 l2 1 M19 16 l1 1 M32 18 l1 1 M37 18 l1 1 M15 24 l4-1 M32 25 l5-1"/><Path d="M25 3 q3-4 5 0 q3-2 3 1 q-1 3-5 5Z"/></>:null}
  {name==='group'?<><Path d="M16 13 q-2-8 7-9 q10 1 9 10 l-2 10 q-7 7-13-1Z M4 23 q-2-7 5-8 q8 0 7 8 l-1 8 q-6 5-10-1Z M33 24 q-2-9 5-9 q8 0 7 10 l-1 7 q-7 5-10-2Z M12 45 q1-15 11-14 q12 0 13 14 M1 44 q0-9 8-8 M40 37 q6 0 7 8 M20 15 l1 1 M27 14 l1 1 M21 23 l5-1"/></>:null}
 </G></Svg>;
}
export function InkFrame({color='#252923'}:{color?:string}) {
 return <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 300 60" preserveAspectRatio="none" style={{position:'absolute',left:0,top:0}}><Path d="M9 3 Q143 0 291 4 Q299 6 297 18 L295 49 Q292 58 281 57 Q140 60 10 56 Q2 54 4 43 L3 14 Q2 4 9 3Z" fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke"/><Path d="M13 58 Q145 61 280 58" fill="none" stroke={color} strokeWidth={.7} vectorEffect="non-scaling-stroke"/></Svg>;
}
