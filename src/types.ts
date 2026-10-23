export type Source =
  "Outlook" | "Google" | "Jira" | "Slack" | "Confluence" | "Personal";
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  source: "Outlook" | "Google" | "Jira";
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
  plannerRank?: number;
  sectionId?: string;
  scheduledStart?: string;
  scheduledDuration?: number;
  deadline?: string;
  allDay?: boolean;
  checklist?: { id: string; title: string; done: boolean }[];
  links?: string[];
  attachments?: { name: string; data: string; type: string }[];
  cover?: string;
  reminderMinutes?: number;
  seriesExceptions?: Record<string, { date: string; start: string; duration: number; cancelled?: boolean }>;
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
  origin?: { source: "Slack" | "GoogleKeep"; id: string };
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
