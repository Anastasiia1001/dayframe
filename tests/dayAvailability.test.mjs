import test from "node:test";
import assert from "node:assert/strict";
import { dayAvailability } from "../src/domain/dayAvailability.ts";
const date = "2026-10-27";
const event = (start, end, extra = {}) => ({
  id: start,
  title: start,
  date,
  start,
  end,
  source: "Google",
  location: "",
  participants: [],
  reminder: false,
  ...extra,
});
test("free gaps merge overlaps and respect the current time without inventing provider availability", () => {
  const records = [
    event("09:00", "10:00"),
    event("09:30", "10:30"),
    event("10:15", "11:00"),
    event("14:00", "15:00"),
  ];
  assert.deepEqual(dayAvailability(records, date, 9 * 60 + 45).free, {
    start: 660,
    end: 840,
  });
  assert.equal(dayAvailability(records, date, 9 * 60 + 45).next.start, "09:00");
});
test("an event spanning midnight blocks the following morning correctly", () => {
  const e = event("23:00", "09:00", { date: "2026-10-26", endDate: date });
  assert.deepEqual(dayAvailability([e], date).free, { start: 540, end: 1200 });
  assert.equal(dayAvailability([e], date).next, e);
});
test("free windows are bounded at 20:00 and exhausted days have no suggested slot", () => {
  assert.deepEqual(dayAvailability([event("22:00", "23:00")], date).free, {
    start: 480,
    end: 1200,
  });
  assert.equal(dayAvailability([], date, 20 * 60).free, null);
  assert.deepEqual(
    dayAvailability([event("00:00", "00:00", { allDay: true })], date).free,
    { start: 480, end: 1200 },
  );
});
