import test from "node:test";
import assert from "node:assert/strict";
import { chooseFocus, focusedOn } from "../src/domain/focus.ts";
const date = "2026-10-27";
const task = (id, extra = {}) => ({
  id,
  title: id,
  date,
  category: "Day",
  recurrence: "once",
  priority: "Normal",
  notes: "",
  completed: false,
  disabled: false,
  ...extra,
});
test("daily focus references real tasks, caps selection at three and preserves hidden records", () => {
  let tasks = [
    task("a"),
    task("b"),
    task("c"),
    task("d"),
    task("hidden", { disabled: true }),
    task("template", { isTemplate: true }),
  ];
  for (const id of ["a", "b", "c"]) tasks = chooseFocus(tasks, id, date);
  assert.equal(tasks.length, 6);
  assert.equal(tasks.filter((t) => focusedOn(t, date)).length, 3);
  assert.equal(chooseFocus(tasks, "d", date), tasks);
  assert.equal(chooseFocus(tasks, "template", date), tasks);
  tasks = chooseFocus(tasks, "a", date);
  tasks = chooseFocus(tasks, "d", date);
  assert.equal(
    focusedOn(
      tasks.find((t) => t.id === "d"),
      date,
    ),
    true,
  );
  assert.equal(
    focusedOn(
      tasks.find((t) => t.id === "a"),
      date,
    ),
    false,
  );
  assert.equal(tasks.find((t) => t.id === "hidden").disabled, true);
  assert.equal(tasks.find((t) => t.id === "template").isTemplate, true);
});
test("focus dates coexist and toggling a date does not remove other dates or create tasks", () => {
  const tasks = [
    task("a", {
      focusDates: ["2026-10-26"],
      checklist: [{ id: "x", title: "Пункт", done: true }],
    }),
  ];
  const next = chooseFocus(tasks, "a", date);
  assert.deepEqual(next[0].focusDates, ["2026-10-26", date]);
  assert.deepEqual(chooseFocus(next, "a", date)[0].focusDates, ["2026-10-26"]);
  assert.deepEqual(next[0].checklist, tasks[0].checklist);
  assert.equal(tasks[0].focusDates.length, 1);
});
test("recurring priorities anchored before today still count toward the daily limit", () => {
  const tasks = [
    task("series", {
      date: "2026-10-20",
      recurrence: "weekly",
      focusDates: [date],
    }),
    task("a", { focusDates: [date] }),
    task("b", { focusDates: [date] }),
    task("c"),
  ];
  assert.equal(chooseFocus(tasks, "c", date), tasks);
});
