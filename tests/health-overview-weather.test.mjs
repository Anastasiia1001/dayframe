import test from "node:test";
import assert from "node:assert/strict";
import { mergeHealth } from "../src/domain/health.ts";
import { overviewRange, overviewTasks } from "../src/domain/overview.ts";
import { weatherKind, parseWeather } from "../src/domain/weather.ts";
test("HealthKit refresh replaces aggregate steps, deduplicates workouts and preserves manual records and empty read results", () => {
  const manual = {
    id: "manual",
    name: "Планка",
    sets: 1,
    reps: 0,
    weight: 0,
    minutes: 1,
    done: false,
  };
  const old = {
    goal: 8000,
    days: { "2026-10-22": { steps: 100, exercises: [manual] } },
  };
  const snapshot = {
    from: "2026-09-23",
    to: "2026-10-22",
    readAt: "2026-10-22T12:00:00Z",
    days: [{ date: "2026-10-22", steps: 4500 }],
    workouts: [
      { id: "native-1", date: "2026-10-22", name: "Ходьба", minutes: 30 },
    ],
  };
  const first = mergeHealth(old, snapshot);
  const again = mergeHealth(first, snapshot);
  assert.equal(again.days["2026-10-22"].steps, 4500);
  assert.equal(again.days["2026-10-22"].exercises.length, 2);
  assert.deepEqual(again.days["2026-10-22"].exercises[0], manual);
  assert.deepEqual(
    mergeHealth(again, { ...snapshot, days: [], workouts: [] }),
    again,
  );
  assert.equal(old.days["2026-10-22"].steps, 100);
  assert.throws(() =>
    mergeHealth(old, {
      ...snapshot,
      days: [{ date: "2026-10-23", steps: 10 }],
    }),
  );
  assert.throws(() =>
    mergeHealth(old, {
      ...snapshot,
      workouts: [{ ...snapshot.workouts[0], minutes: -1 }],
    }),
  );
});
test("overview periods handle week, quarter and year boundaries and include only the chosen period", () => {
  assert.deepEqual(overviewRange("2026-10-22", "week"), {
    from: "2026-10-19",
    to: "2026-10-25",
  });
  assert.deepEqual(overviewRange("2026-10-22", "quarter"), {
    from: "2026-10-01",
    to: "2026-12-31",
  });
  assert.deepEqual(overviewRange("2024-02-12", "month"), {
    from: "2024-02-01",
    to: "2024-02-29",
  });
  assert.deepEqual(overviewRange("2026-10-22", "year"), {
    from: "2026-01-01",
    to: "2026-12-31",
  });
  const tasks = [
    {
      id: "month",
      planningHorizon: "month",
      inBacklog: true,
      planningAnchor: "2026-10-22",
    },
    { id: "future", date: "2026-11-05" },
    { id: "day", date: "2026-10-22" },
    { id: "backlog", inBacklog: true, planningHorizon: "backlog" },
    { id: "template", isTemplate: true, date: "2026-10-22" },
  ];
  assert.deepEqual(
    overviewTasks(tasks, "2026-10-22", "week").map((t) => t.id),
    ["day"],
  );
  assert.deepEqual(
    overviewTasks(tasks, "2026-10-22", "month").map((t) => t.id),
    ["month", "day"],
  );
  assert.deepEqual(
    overviewTasks(tasks, "2026-10-22", "year").map((t) => t.id),
    ["month", "future", "day"],
  );
});
test("weather visuals map snow, rain, thunderstorms, sunshine and unavailable responses", () => {
  assert.equal(weatherKind(73), "snow");
  assert.equal(weatherKind(85), "snow");
  assert.equal(weatherKind(61), "rain");
  assert.equal(weatherKind(95), "storm");
  assert.equal(weatherKind(0), "sun");
  const parsed = parseWeather({
    current: {
      temperature_2m: 3.5,
      apparent_temperature: 0,
      weather_code: 73,
      is_day: 1,
    },
  });
  assert.equal(parsed.temperature, 3.5);
  assert.equal(parsed.isDay, true);
  assert.throws(() => parseWeather({ current: { weather_code: 0 } }));
});
