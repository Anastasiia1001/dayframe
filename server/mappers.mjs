function eventTime(value, allDay = false, timeZone = "UTC") {
  if (!value) throw new Error("Не вказано час події");
  // All-day dates are dates, not UTC timestamps. Keep them in the selected local day.
  const date = new Date(allDay ? value.slice(0, 10) + "T12:00:00" : value);
  if (!Number.isFinite(date.getTime()))
    throw new Error("Некоректна дата або час події");
  if (allDay) return { date: value.slice(0, 10), time: "Увесь день" };
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (t) => parts.find((p) => p.type === t).value;
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}
export function mapOutlookEvent(e, timeZone = "UTC") {
  const start = eventTime(
    e.start?.dateTime
      ? e.start.dateTime +
          (e.start.timeZone === "UTC" &&
          !/Z$|[+-]\d\d:\d\d$/.test(e.start.dateTime)
            ? "Z"
            : "")
      : "",
    false,
    timeZone,
  );
  const end = eventTime(
    e.end?.dateTime
      ? e.end.dateTime +
          (e.end.timeZone === "UTC" && !/Z$|[+-]\d\d:\d\d$/.test(e.end.dateTime)
            ? "Z"
            : "")
      : "",
    false,
    timeZone,
  );
  return {
    id: `outlook:${e.id}`,
    title: e.subject || "Подія без назви",
    date: start.date,
    start: e.isAllDay ? "Увесь день" : start.time,
    end: e.isAllDay ? "Увесь день" : end.time,
    endDate: end.date,
    allDay: !!e.isAllDay,
    source: "Outlook",
    location:
      e.location?.displayName || e.onlineMeeting?.joinUrl || "Місце не вказано",
    participants: (e.attendees || []).map(
      (a) => a.emailAddress?.name || a.emailAddress?.address || "Учасник",
    ),
    externalUid: e.iCalUId,
    reminder: !!e.isReminderOn,
    url: e.webLink,
  };
}
export function mapGoogleEvent(e, timeZone = "UTC") {
  const allDay = !!e.start?.date;
  const start = eventTime(e.start?.date || e.start?.dateTime, allDay, timeZone);
  const end = eventTime(e.end?.date || e.end?.dateTime, allDay, timeZone);
  return {
    id: `google:${e.id}`,
    title: e.summary || "Подія без назви",
    date: start.date,
    start: start.time,
    end: end.time,
    endDate: end.date,
    allDay,
    source: "Google",
    location: e.location || e.hangoutLink || "Місце не вказано",
    participants: (e.attendees || []).map((a) => a.displayName || a.email),
    externalUid: e.iCalUID,
    reminder: !!e.reminders?.useDefault || !!e.reminders?.overrides?.length,
    url: e.htmlLink,
  };
}
export function mapSlackMatch(m, group) {
  return {
    id: `slack:${m.channel?.id}:${m.ts}`,
    channel: m.channel?.name || "conversation",
    author: m.user || "Учасник Slack",
    summary: m.text || "(Повідомлення без тексту)",
    why:
      group === "Direct mentions"
        ? "Тебе згадали особисто."
        : "Знайдено у вибраних каналах. Це результат пошуку, а не ШІ-огляд.",
    time: new Date(Number(m.ts) * 1000).toISOString(),
    group,
    url: m.permalink,
  };
}
