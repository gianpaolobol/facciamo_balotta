import * as Contacts from 'expo-contacts/legacy';
import * as SMS from 'expo-sms';
import * as MailComposer from 'expo-mail-composer';
import {Linking,Platform} from 'react-native';
import {createContactAdapterFlow} from './contact-adapter-flow.mjs';
export type LocalContact={id:string;name:string;phones:string[];emails:string[]};
export type ComposeInput={channel:'whatsapp'|'sms'|'email';address:string;message:string};
export type ComposeResult={status:'opened'|'sent'|'cancelled'|'saved'|'unknown'};
export const invitationUrl=process.env.EXPO_PUBLIC_INVITATION_URL?.trim()||'';
export const nativeContactsSupported=Platform.OS==='ios'||Platform.OS==='android';
// Creating the flow does not invoke permissions, contacts, availability, or composers.
const flow=createContactAdapterFlow({
 supported:nativeContactsSupported,
 getPermission:()=>Contacts.getPermissionsAsync(),
 requestPermission:()=>Contacts.requestPermissionsAsync(),
 getPage:(query:Contacts.ContactQuery)=>Contacts.getContactsAsync(query),
 smsAvailable:()=>SMS.isAvailableAsync(),
 sendSMS:(addresses:string[],message:string)=>SMS.sendSMSAsync(addresses,message),
 mailAvailable:()=>MailComposer.isAvailableAsync(),
 composeMail:(options:MailComposer.MailComposerOptions)=>MailComposer.composeAsync(options),
 openURL:(url:string)=>Linking.openURL(url),
});
export const hasPermission=():Promise<boolean>=>flow.hasPermission();
export const readContacts=(isCurrent:()=>boolean):Promise<{contacts:LocalContact[];limited:boolean}>=>flow.readContacts(isCurrent);
export const compose=(input:ComposeInput,isCurrent:()=>boolean=()=>true):Promise<ComposeResult>=>flow.compose(input,isCurrent);

export const refreshContacts=(isCurrent:()=>boolean):Promise<{contacts:LocalContact[];limited:boolean}>=>flow.refreshContacts(isCurrent);
