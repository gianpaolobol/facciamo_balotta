const SCENES=new Set(['registration','app','match','appointment']);
export function demoScene(value,platform='web'){return platform==='web'&&SCENES.has(value)?value:null;}
export function canOpenDemo(platform,liveOnly,nativeDemoEnabled){
 return !liveOnly&&(platform==='web'||nativeDemoEnabled&&(platform==='ios'||platform==='android'));
}
