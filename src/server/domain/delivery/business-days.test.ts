import { describe, expect, it } from "vitest";
import {
  addBusinessDays,
  addCalendarDays,
  isBusinessDay,
  isWeekend,
  toDateKey,
} from "./business-days";

const monday = new Date("2026-09-21T12:00:00Z");
const friday = new Date("2026-09-25T12:00:00Z");
const saturday = new Date("2026-09-26T12:00:00Z");
const sunday = new Date("2026-09-27T12:00:00Z");

describe("isWeekend / isBusinessDay", () => {
  it("recognises Saturday and Sunday", () => {
    expect(isWeekend(saturday)).toBe(true);
    expect(isWeekend(sunday)).toBe(true);
    expect(isWeekend(monday)).toBe(false);
    expect(isWeekend(friday)).toBe(false);
  });

  it("treats a supplied non-working date as a non-business day", () => {
    expect(isBusinessDay(monday)).toBe(true);
    expect(isBusinessDay(monday, new Set([toDateKey(monday)]))).toBe(false);
  });
});

describe("addCalendarDays", () => {
  it("advances across weekends without skipping them", () => {
    // Production is a wall-clock commitment: Friday + 3 days is Monday.
    expect(toDateKey(addCalendarDays(friday, 3))).toBe("2026-09-28");
  });

  it("is a no-op for zero", () => {
    expect(addCalendarDays(monday, 0).getTime()).toBe(monday.getTime());
  });

  it("rejects negative or fractional days", () => {
    expect(() => addCalendarDays(monday, -1)).toThrow(RangeError);
    expect(() => addCalendarDays(monday, 1.5)).toThrow(RangeError);
  });
});

describe("addBusinessDays", () => {
  it("skips the weekend", () => {
    // Friday + 1 business day is Monday, not Saturday.
    expect(toDateKey(addBusinessDays(friday, 1))).toBe("2026-09-28");
    expect(toDateKey(addBusinessDays(monday, 5))).toBe("2026-09-28");
  });

  it("moves a weekend start forward even for zero days", () => {
    // A parcel "posted today" on a Saturday is really posted on Monday.
    expect(toDateKey(addBusinessDays(saturday, 0))).toBe("2026-09-28");
    expect(toDateKey(addBusinessDays(sunday, 0))).toBe("2026-09-28");
  });

  it("leaves a business day untouched for zero days", () => {
    expect(toDateKey(addBusinessDays(monday, 0))).toBe("2026-09-21");
  });

  it("skips supplied holidays", () => {
    const holidays = new Set(["2026-09-22", "2026-09-23"]);
    expect(toDateKey(addBusinessDays(monday, 1, holidays))).toBe("2026-09-24");
  });

  it("never returns a non-working day", () => {
    const holidays = new Set(["2026-09-28"]);
    for (let days = 0; days <= 10; days++) {
      const result = addBusinessDays(friday, days, holidays);
      expect(isBusinessDay(result, holidays)).toBe(true);
    }
  });

  it("rejects negative or fractional days", () => {
    expect(() => addBusinessDays(monday, -1)).toThrow(RangeError);
    expect(() => addBusinessDays(monday, 2.5)).toThrow(RangeError);
  });
});
