import type { ReadProvider, CalendarEvent, JiraIssue, SlackDigestItem, ConfluencePage } from '../types';
import { mockCalendar } from './mockCalendar';
import { mockJira } from './mockJira';
import { mockSlack } from './mockSlack';
import { mockConfluence } from './mockConfluence';
export interface CalendarProvider extends ReadProvider<CalendarEvent> {}
export interface JiraAdapter extends ReadProvider<JiraIssue> {}
export interface SlackAdapter extends ReadProvider<SlackDigestItem> {}
export interface ConfluenceAdapter extends ReadProvider<ConfluencePage> {}
export class MockProvider<T> implements ReadProvider<T> { constructor(private items:T[]){} async getAll(){return structuredClone(this.items)} }
// Replace providers here with API adapters. UI components only consume domain types.
export const providers={calendar:new MockProvider(mockCalendar) as CalendarProvider,jira:new MockProvider(mockJira.filter(i=>i.assigned||i.mentioned)) as JiraAdapter,slack:new MockProvider(mockSlack) as SlackAdapter,confluence:new MockProvider(mockConfluence) as ConfluenceAdapter};
