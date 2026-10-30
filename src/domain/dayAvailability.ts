import type { CalendarEvent } from "../types";
import { eventOnDay, minutes } from "./planning.ts";
/** An indicative gap between timed records in the visible planning window, not provider free/busy. */
export function dayAvailability(
  events: CalendarEvent[],
  date: string,
  nowMinutes = 8 * 60,
  bounds = { start: 8 * 60, end: 20 * 60 },
) {
  const start = Math.max(bounds.start, Math.ceil(nowMinutes / 15) * 15),
    until = bounds.end;
  const intervals = events
    .filter((e) => !e.allDay && eventOnDay(e, date))
    .map((event) => ({
      event,
      start: event.date < date ? 0 : minutes(event.start),
      end:
        (event.endDate && event.endDate > date) ||
        (!event.endDate && event.end < event.start && event.date === date)
          ? 1440
          : minutes(event.end),
    }))
    .sort((a, b) => a.start - b.start);
  const next = intervals.find((e) => e.end > nowMinutes)?.event;
  let cursor = start;
  for (const interval of intervals) {
    if (interval.end <= cursor) continue;
    const gapEnd = Math.min(interval.start, until);
    if (gapEnd - cursor >= 30)
      return { next, free: { start: cursor, end: gapEnd } };
    cursor = Math.max(cursor, interval.end);
    if (cursor >= until) return { next, free: null };
  }
  return {
    next,
    free: until - cursor >= 30 ? { start: cursor, end: until } : null,
  };
}
