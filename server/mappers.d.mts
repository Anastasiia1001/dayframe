import type { CalendarEvent, SlackDigestItem } from "../src/types";
export function mapOutlookEvent(event: unknown, timeZone?: string): CalendarEvent;
export function mapGoogleEvent(event: unknown, timeZone?: string): CalendarEvent;
export function mapSlackMatch(message: unknown, group: string): SlackDigestItem;
