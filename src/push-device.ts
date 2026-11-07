// Web must not import or call any native push SDK.
export type PushRequester=(path:string,method?:string,body?:unknown)=>Promise<any>;
export async function disableNativePush(_request:PushRequester):Promise<void>{}
