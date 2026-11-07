// Web fallback intentionally imports no native SDKs.
import {createContactAdapterFlow} from './contact-adapter-flow.mjs';
export type LocalContact={id:string;name:string;phones:string[];emails:string[]};
export type ComposeInput={channel:'whatsapp'|'sms'|'email';address:string;message:string};
export type ComposeResult={status:'opened'|'sent'|'cancelled'|'saved'|'unknown'};
export const invitationUrl=process.env.EXPO_PUBLIC_INVITATION_URL?.trim()||'';
export const nativeContactsSupported=false;
const flow=createContactAdapterFlow({supported:false});
export const hasPermission=():Promise<boolean>=>flow.hasPermission();
export const readContacts=(isCurrent:()=>boolean):Promise<{contacts:LocalContact[];limited:boolean}>=>flow.readContacts(isCurrent);
export const compose=(input:ComposeInput,isCurrent:()=>boolean=()=>true):Promise<ComposeResult>=>flow.compose(input,isCurrent);

export const refreshContacts=(isCurrent:()=>boolean):Promise<{contacts:LocalContact[];limited:boolean}>=>flow.refreshContacts(isCurrent);
