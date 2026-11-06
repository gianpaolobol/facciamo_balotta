const SCENES=new Set(['registration','app','match','appointment']);
export function demoScene(value){return SCENES.has(value)?value:null;}
