import type {
  ReadProvider,
  CalendarEvent,
  JiraIssue,
  SlackDigestItem,
  ConfluencePage,
} from "../types";
import { mockCalendar } from "./mockCalendar";
import { mockSlack } from "./mockSlack";
export interface CalendarProvider extends ReadProvider<CalendarEvent> {}
export interface JiraAdapter extends ReadProvider<JiraIssue> {}
export interface SlackAdapter extends ReadProvider<SlackDigestItem> {}
export interface ConfluenceAdapter extends ReadProvider<ConfluencePage> {}
export class MockProvider<T> implements ReadProvider<T> {
  constructor(private items: T[]) {}
  async getAll() {
    return structuredClone(this.items);
  }
}
// Replace providers here with API adapters. UI components only consume domain types.
// Jira and Confluence are intentionally excluded: no reads or connections.
export const providers = {
  calendar: new MockProvider(mockCalendar) as CalendarProvider,
  slack: new MockProvider(mockSlack) as SlackAdapter,
};
