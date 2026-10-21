import test from "node:test";
import assert from "node:assert/strict";
import {
  activeTasks,
  moveDate,
  dateKey,
  postponedTask,
  layoutEvents,
  eventOnDay,
  normalizeStoredTasks,
} from "../src/domain/planning.ts";
const task = {
  id: "custom",
  title: "Важлива справа",
  date: "2026-01-01",
  category: "Day",
  priority: "High",
  recurrence: "daily",
  notes: "Не втратити",
  completed: true,
  disabled: false,
  completedOn: "2026-01-01",
  nextOccurrence: "2026-01-02",
};
const event = (id, start, end, extra = {}) => ({
  id,
  title: id,
  date: "2026-10-20",
  start,
  end,
  source: "Outlook",
  location: "",
  participants: [],
  reminder: false,
  ...extra,
});
test("month navigation clamps to the target month and supports leap years", () => {
  assert.equal(
    dateKey(moveDate(new Date(2026, 0, 31), "Month", 1)),
    "2026-02-28",
  );
  assert.equal(
    dateKey(moveDate(new Date(2028, 0, 31), "Month", 1)),
    "2028-02-29",
  );
  assert.equal(
    dateKey(moveDate(new Date(2026, 2, 31), "Month", -1)),
    "2026-02-28",
  );
  assert.equal(
    dateKey(moveDate(new Date(2026, 9, 20), "Week", 1)),
    "2026-10-27",
  );
});
test("postponing uses ISO dates, moves overdue work to tomorrow and preserves user content", () => {
  const t = postponedTask(task, "2026-10-20");
  assert.equal(t.date, "2026-10-21");
  assert.equal(t.completed, false);
  assert.equal(t.nextOccurrence, undefined);
  assert.equal(t.notes, task.notes);
  assert.equal(t.title, task.title);
  assert.equal(
    postponedTask({ ...task, date: "2026-12-31" }, "2026-10-20").date,
    "2027-01-01",
  );
});
test("overlapping calendar events get separate lanes; adjacent meetings share space", () => {
  const positions = layoutEvents(
    [
      event("a", "09:00", "12:00"),
      event("b", "09:30", "10:30"),
      event("c", "10:00", "11:00"),
      event("d", "12:00", "13:00"),
    ],
    "2026-10-20",
  );
  assert.deepEqual(
    positions.map((p) => [p.event.id, p.column, p.columns]),
    [
      ["a", 0, 3],
      ["b", 1, 3],
      ["c", 2, 3],
      ["d", 0, 1],
    ],
  );
});
test("overnight events are split and all-day ends remain exclusive", () => {
  const e = event("night", "23:00", "01:00", { endDate: "2026-10-21" });
  assert.equal(eventOnDay(e, "2026-10-21"), true);
  assert.deepEqual(
    layoutEvents([e], "2026-10-20").map((e) => [e.start, e.end]),
    [[1380, 1440]],
  );
  assert.deepEqual(
    layoutEvents([e], "2026-10-21").map((e) => [e.start, e.end]),
    [[0, 60]],
  );
  assert.equal(eventOnDay({ ...e, end: "00:00" }, "2026-10-21"), false);
  assert.equal(eventOnDay({ ...e, allDay: true }, "2026-10-21"), false);
});
test("only untouched seeded routines move to the library; rescheduled and edited tasks stay active", () => {
  const seed = {
    ...task,
    id: "Month-0",
    category: "Month",
    completed: false,
    notes: "",
    recurrence: "monthly",
    nextOccurrence: undefined,
  };
  const anchor = { ...task, id: "Day-3" };
  const untouched = { ...seed };
  const scheduled = { ...seed, id: "Month-1", date: "2026-11-01" };
  const edited = { ...seed, id: "Month-2", notes: "Мій власний план" };
  const result = normalizeStoredTasks(
    [anchor, untouched, scheduled, edited],
    [
      { ...seed, isTemplate: true },
      { ...seed, id: "Month-1", isTemplate: true },
      { ...seed, id: "Month-2", isTemplate: true },
    ],
    "2026-10-20",
  );
  assert.equal(result[1].isTemplate, true);
  assert.equal(result[2].isTemplate, undefined);
  assert.equal(result[3].isTemplate, undefined);
  assert.equal(result[2].date, "2026-11-01");
  assert.equal(result[3].notes, "Мій власний план");
});

test("backlog tasks are excluded from scheduled work while existing dated tasks remain", () => {
  const planned = { ...task, completed: false };
  const backlog = { ...planned, id: "backlog", inBacklog: true };
  assert.deepEqual(activeTasks([planned, backlog, { ...planned, id: "template", isTemplate: true }]), [planned]);
});
