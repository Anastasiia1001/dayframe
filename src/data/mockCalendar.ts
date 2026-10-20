import type { CalendarEvent } from '../types';
export const today = new Date().toLocaleDateString('en-CA');
export const mockCalendar:CalendarEvent[]=[
{id:'c1',title:'Daily standup',date:today,start:'09:30',end:'10:00',source:'Outlook',location:'Microsoft Teams',participants:['Alex','Maya','Sam'],reminder:true},
{id:'c2',title:'UI design review',date:today,start:'11:00',end:'12:00',source:'Outlook',location:'Microsoft Teams',participants:['Alex','Maya','Sam','You'],reminder:true},
{id:'c3',title:'A little time for lunch',date:today,start:'13:00',end:'14:00',source:'Google',location:'Personal time',participants:[],reminder:false},
{id:'c4',title:'1:1 with Maya',date:today,start:'15:30',end:'16:00',source:'Outlook',location:'Google Meet',participants:['Maya'],reminder:true},
{id:'c5',title:'Evening walk',date:today,start:'18:00',end:'18:30',source:'Google',location:'Outside, a screen-free break',participants:[],reminder:false}];
