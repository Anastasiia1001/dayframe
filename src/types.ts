export type Source =
  "Outlook" | "Google" | "Jira" | "Slack" | "Confluence" | "Personal";
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  source: "Outlook" | "Google";
  location: string;
  participants: string[];
  reminder: boolean;
  meetingUrl?: string;
  accountLabel?: string;
  externalUid?: string;
  allDay?: boolean;
  endDate?: string;
  url?: string;
}
export interface JiraIssue {
  id: string;
  title: string;
  status: string;
  priority: string;
  due: string;
  project: string;
  labels: string[];
  updated: string;
  assigned: boolean;
  mentioned: boolean;
}
export interface SlackMessage {
  id: string;
  channel: string;
  author: string;
  summary: string;
  why: string;
  time: string;
  url?: string;
}
export interface SlackDigestItem extends SlackMessage {
  group: string;
}
export interface ConfluencePage {
  id: string;
  title: string;
  space: string;
  author: string;
  updated: string;
  summary: string;
}
export type Period = "Day" | "Month" | "Quarter" | "Year";
export type PlanningHorizon = "backlog" | "year" | "month" | "week" | "day";
export interface PersonalTask {
  planningHorizon?: PlanningHorizon;
  planningAnchor?: string;
  id: string;
  title: string;
  category: Period;
  date: string;
  recurrence: string;
  priority: string;
  notes: string;
  completed: boolean;
  disabled: boolean;
  origin?: { source: "Slack"; id: string };
  jiraUrl?: string;
  inBacklog?: boolean;
  isTemplate?: boolean;
  customDays?: number;
  completedOn?: string;
  nextOccurrence?: string;
}
export interface ReadProvider<T> {
  getAll(): Promise<T[]>;
}
