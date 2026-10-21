import test from "node:test";
import assert from "node:assert/strict";
import { quickEntry, scheduledEvents } from "../src/domain/studio.ts";
const task = {
  id: "unity",
  title: "Протестувати префаби",
  date: "2026-10-21",
  scheduledStart: "15:00",
  scheduledDuration: 60,
  recurrence: "weekly",
  completed: false,
  disabled: false,
};
test("Ukrainian quick entry recognizes tomorrow, time and duration without saving", () => {
  assert.deepEqual(
    quickEntry("Завтра о 15:00 перевірити префаби, година", "2026-10-21"),
    {
      date: "2026-10-22",
      start: "15:00",
      duration: 60,
      title: "перевірити префаби",
    },
  );
  assert.equal(
    quickEntry("Післязавтра о 09:30 зйомка, 2 години", "2026-10-21").date,
    "2026-10-23",
  );
});
test("Recurring schedules retain the original series and support moved and skipped instances", () => {
  const tasks = [
    {
      ...task,
      seriesExceptions: {
        "2026-10-28": { date: "2026-10-29", start: "10:00", duration: 90 },
        "2026-11-04": {
          date: "2026-11-04",
          start: "15:00",
          duration: 60,
          cancelled: true,
        },
      },
    },
  ];
  const result = scheduledEvents(tasks, "2026-10-21", "2026-11-05");
  assert.deepEqual(
    result.map((e) => [e.date, e.start, e.end]),
    [
      ["2026-10-21", "15:00", "16:00"],
      ["2026-10-29", "10:00", "11:30"],
    ],
  );
  assert.equal(tasks[0].date, "2026-10-21");
});
test("A moved instance remains visible when its original date is outside the window", () => {
  const result = scheduledEvents(
    [
      {
        ...task,
        seriesExceptions: {
          "2026-10-28": { date: "2026-10-30", start: "11:00", duration: 60 },
        },
      },
    ],
    "2026-10-30",
    "2026-10-30",
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].date, "2026-10-30");
});
test("Unscheduled, completed and paused tasks never become calendar events", () => {
  assert.equal(
    scheduledEvents(
      [
        { ...task, inBacklog: true },
        { ...task, completed: true },
        { ...task, disabled: true },
        { ...task, scheduledStart: undefined },
      ],
      "2026-10-01",
      "2026-11-01",
    ).length,
    0,
  );
});

import { parseBackup, writeBackup } from "../src/domain/backup.ts";
test("Backup validation rejects malformed nested records and deduplicates imported task ids", () => {
  const valid = {
    ...task,
    notes: "Зберегти",
    category: "Day",
    priority: "Normal",
  };
  const backup = {
    format: "dayframe-backup",
    version: 1,
    data: { "dayframe-tasks": [valid, valid] },
  };
  assert.equal(parseBackup(backup).tasks.length, 1);
  assert.throws(() =>
    parseBackup({
      ...backup,
      data: { "dayframe-tasks": [{ ...valid, checklist: [null] }] },
    }),
  );
  assert.throws(() =>
    parseBackup({
      ...backup,
      data: {
        ...backup.data,
        "dayframe-daily-plans": {
          "2026-10-21": { notes: "", priorities: "bad" },
        },
      },
    }),
  );
});
test("A failed import rolls back previously written keys", () => {
  const data = new Map([
    ["tasks", "old"],
    ["notes", "kept"],
  ]);
  const storage = {
    getItem: (k) => data.get(k) ?? null,
    removeItem: (k) => data.delete(k),
    setItem: (k, v) => {
      if (v === '"too large"') throw Error("quota");
      data.set(k, v);
    },
  };
  assert.throws(() =>
    writeBackup(storage, { tasks: "new", notes: "too large" }),
  );
  assert.equal(data.get("tasks"), "old");
  assert.equal(data.get("notes"), "kept");
});
