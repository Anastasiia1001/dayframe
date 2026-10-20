export type Source = 'Outlook' | 'Google' | 'Jira' | 'Slack' | 'Confluence' | 'Personal';
export interface CalendarEvent { id:string; title:string; date:string; start:string; end:string; source:'Outlook'|'Google'; location:string; participants:string[]; reminder:boolean }
export interface JiraIssue { id:string; title:string; status:string; priority:string; due:string; project:string; labels:string[]; updated:string; assigned:boolean; mentioned:boolean }
export interface SlackMessage { id:string; channel:string; author:string; summary:string; why:string; time:string }
export interface SlackDigestItem extends SlackMessage { group:string }
export interface ConfluencePage { id:string; title:string; space:string; author:string; updated:string; summary:string }
export type Period='Day'|'Month'|'Quarter'|'Year';
export interface PersonalTask { id:string; title:string; category:Period; date:string; recurrence:string; priority:string; notes:string; completed:boolean; disabled:boolean; customDays?:number }
export interface ReadProvider<T> { getAll():Promise<T[]> }
