import test from "node:test";
import assert from "node:assert/strict";
import {
  PRIVATE_REST_KEY,
  readPrivateNotes,
  writePrivateNotes,
  backupKeyAllowed,
  restOccurrences,
  lightenDay,
} from "../src/domain/rest.ts";
const day = "2026-10-27";
const task = (id, extra = {}) => ({
  id,
  title: id,
  date: day,
  recurrence: "once",
  notes: "",
  category: "Day",
  priority: "Normal",
  completed: false,
  disabled: false,
  ...extra,
});
test("private notes are explicit, validated local records excluded from backups", () => {
  const data = new Map(),
    storage = {
      getItem: (k) => data.get(k) || null,
      setItem: (k, v) => data.set(k, v),
    };
  assert.deepEqual(readPrivateNotes(storage), []);
  const notes = [
    { id: "note", text: "особистий запис", updated: new Date().toISOString() },
  ];
  writePrivateNotes(storage, notes);
  assert.deepEqual(readPrivateNotes(storage), notes);
  assert.equal(backupKeyAllowed(PRIVATE_REST_KEY), false);
  assert.equal(backupKeyAllowed("dayframe-private-other"), false);
  assert.equal(backupKeyAllowed("dayframe-tasks"), true);
  assert.equal(backupKeyAllowed("dayframe-google-token"), false);
  data.set(PRIVATE_REST_KEY, '[{"text":"damaged"}]');
  assert.throws(() => readPrivateNotes(storage));
  assert.throws(
    () =>
      writePrivateNotes(
        {
          setItem: () => {
            throw Error("quota");
          },
        },
        notes,
      ),
    /quota/,
  );
});
test("occurrences include actual recurring executions and respect cancellations and moved exceptions", () => {
  const recurring = task("repeat", {
    date: "2026-10-20",
    recurrence: "weekly",
  });
  assert.equal(restOccurrences([recurring], day).length, 1);
  assert.equal(
    restOccurrences(
      [
        {
          ...recurring,
          seriesExceptions: {
            [day]: { date: day, start: "09:00", duration: 30, cancelled: true },
          },
        },
      ],
      day,
    ).length,
    0,
  );
  assert.equal(
    restOccurrences(
      [
        task("future", {
          date: "2026-10-28",
          seriesExceptions: {
            "2026-10-28": { date: day, start: "09:00", duration: 30 },
          },
        }),
      ],
      day,
    ).length,
    1,
  );
  assert.equal(
    restOccurrences(
      [
        task("done", { completed: true }),
        task("template", { isTemplate: true }),
        task("backlog", { inBacklog: true }),
      ],
      day,
    ).length,
    0,
  );
});
test("lighten is a pure transaction: ordinary records retain IDs, notes, deadlines and checks", () => {
  const tasks = [
    task("a", {
      deadline: "2026-11-10",
      checklist: [{ id: "c", title: "підзадача", done: true }],
    }),
    task("b"),
    task("untouched", { date: "2026-12-01" }),
  ];
  const original = structuredClone(tasks);
  const out = lightenDay(
    tasks,
    day,
    ["b"],
    [
      {
        id: "a",
        occurrence: day,
        action: "date",
        date: "2026-10-29",
        scope: "occurrence",
      },
    ],
    () => assert.fail("ordinary move must not clone"),
  );
  assert.deepEqual(tasks, original);
  assert.equal(out.tasks.length, 3);
  assert.equal(out.tasks[0].id, "a");
  assert.equal(out.tasks[0].deadline, "2026-11-10");
  assert.deepEqual(out.tasks[0].checklist, tasks[0].checklist);
  assert.equal(out.tasks[0].date, "2026-10-29");
  assert.deepEqual(out.tasks[1].focusDates, [day]);
  assert.equal(out.tasks[2], tasks[2]);
  assert.equal(out.changes.length, 2);
});
test("moving only one recurring execution cancels precisely that execution and makes one explicit local copy", () => {
  const t = task("r", {
    date: "2026-10-20",
    recurrence: "weekly",
    scheduledStart: "10:00",
    scheduledDuration: 60,
  });
  const out = lightenDay(
    [t],
    day,
    [],
    [{ id: "r", occurrence: day, action: "backlog", scope: "occurrence" }],
    () => "execution",
  );
  assert.equal(out.tasks.length, 2);
  assert.equal(out.tasks[0].date, t.date);
  assert.equal(out.tasks[0].recurrence, "weekly");
  assert.equal(out.tasks[0].seriesExceptions[day].cancelled, true);
  assert.equal(out.tasks[1].id, "execution");
  assert.equal(out.tasks[1].recurrence, "once");
  assert.equal(out.tasks[1].date, "");
  assert.equal(out.tasks[1].inBacklog, true);
  assert.equal(out.tasks[1].scheduledStart, "10:00");
  assert.equal(restOccurrences(out.tasks, day).length, 0);
  assert.equal(restOccurrences(out.tasks, "2026-11-03").length, 1);
});
test("explicit series move retains series identity and does not create a copy", () => {
  const t = task("r", { date: "2026-10-20", recurrence: "weekly" });
  const out = lightenDay(
    [t],
    day,
    [],
    [
      {
        id: "r",
        occurrence: day,
        action: "date",
        date: "2026-10-30",
        scope: "series",
      },
    ],
    () => assert.fail("no copy"),
  );
  assert.equal(out.tasks.length, 1);
  assert.equal(out.tasks[0].id, "r");
  assert.equal(out.tasks[0].recurrence, "weekly");
  assert.equal(out.tasks[0].date, "2026-10-30");
});
test("lighten rejects invalid dates, stale references and more than three focus IDs", () => {
  const tasks = ["a", "b", "c", "d"].map((id) => task(id));
  assert.throws(() =>
    lightenDay(tasks, day, ["a", "b", "c", "d"], [], () => ""),
  );
  assert.throws(() =>
    lightenDay(
      tasks,
      day,
      [],
      [{ id: "absent", occurrence: day, action: "backlog", scope: "series" }],
      () => "",
    ),
  );
  for (const date of ["", "2026-02-30", "2026-99-99"])
    assert.throws(() =>
      lightenDay(
        tasks,
        day,
        [],
        [{ id: "a", occurrence: day, action: "date", date, scope: "series" }],
        () => "",
      ),
    );
  const out = lightenDay(
    tasks,
    day,
    ["a"],
    [{ id: "a", occurrence: day, action: "backlog", scope: "series" }],
    () => "",
  );
  assert.equal(out.tasks[0].date, day);
});
