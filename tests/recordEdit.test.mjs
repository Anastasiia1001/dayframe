import test from "node:test";
import assert from "node:assert/strict";
import { applyRecordEdit } from "../src/domain/recordEdit.ts";
import { dayAvailability } from "../src/domain/dayAvailability.ts";
import { overviewTasks } from "../src/domain/overview.ts";
const task = {
  id: "a",
  title: "Корм",
  category: "Day",
  date: "2026-12-28",
  recurrence: "weekly",
  priority: "Normal",
  notes: "зберегти",
  completed: false,
  disabled: false,
  attachments: [{ name: "ref", data: "abc", type: "text/plain" }],
};
test("one recurring edit skips original instance, preserves attachments and leaves other occurrences unchanged", () => {
  const result = applyRecordEdit(
    [task],
    { ...task, date: "2027-01-05", title: " Купити корм " },
    "one",
    "2027-01-04",
    () => "copy",
  );
  assert.equal(result[0].id, "a");
  assert.equal(result[0].date, "2026-12-28");
  assert.equal(result[0].seriesExceptions["2027-01-04"].cancelled, true);
  assert.equal(result[1].id, "copy");
  assert.equal(result[1].recurrence, "once");
  assert.equal(result[1].title, "Купити корм");
  assert.deepEqual(result[1].attachments, task.attachments);
});
test("series shift preserves identity across year boundary without duplicating the record", () => {
  const result = applyRecordEdit(
    [task],
    { ...task, date: "2027-01-05" },
    "all",
    "2027-01-04",
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "a");
  assert.equal(result[0].date, "2026-12-29");
});
test("next-week plans stay out of current week and appear next week across year boundary", () => {
  const plan = {
    ...task,
    inBacklog: true,
    planningHorizon: "week",
    planningAnchor: "2027-01-04",
  };
  assert.equal(overviewTasks([plan], "2026-12-31", "week").length, 0);
  assert.equal(overviewTasks([plan], "2027-01-05", "week").length, 1);
});
test("availability honours configured day boundaries", () => {
  assert.deepEqual(
    dayAvailability([], "2026-10-30", 0, { start: 600, end: 1020 }).free,
    { start: 600, end: 1020 },
  );
  assert.equal(
    dayAvailability([], "2026-10-30", 1020, { start: 600, end: 1020 }).free,
    null,
  );
});
test("removing the date from a recurring series never creates an invalid date", () => {
  const result = applyRecordEdit(
    [task],
    { ...task, inBacklog: true, date: "" },
    "all",
    task.date,
  );
  assert.equal(result[0].date, "");
  assert.equal(result[0].inBacklog, true);
});
test("inferred midnight event blocks the late configured day", () => {
  const event = {
    id: "night",
    title: "Нічна подія",
    date: "2026-10-30",
    start: "23:00",
    end: "09:00",
    source: "Google",
    location: "",
    participants: [],
    reminder: false,
  };
  assert.equal(
    dayAvailability([event], "2026-10-30", 23 * 60, {
      start: 8 * 60,
      end: 24 * 60,
    }).free,
    null,
  );
});
test("midnight records remain visible when the next day is opened alone", async () => {
  const { scheduledEvents } = await import("../src/domain/studio.ts");
  const event = {
    ...task,
    date: "2026-10-30",
    recurrence: "once",
    scheduledStart: "23:30",
    scheduledDuration: 60,
  };
  const result = scheduledEvents([event], "2026-10-31", "2026-10-31");
  assert.equal(result.length, 1);
  assert.equal(result[0].date, "2026-10-30");
  assert.equal(result[0].endDate, "2026-10-31");
  assert.equal(
    scheduledEvents(
      [{ ...event, scheduledDuration: 30 }],
      "2026-10-31",
      "2026-10-31",
    ).length,
    0,
  );
});
