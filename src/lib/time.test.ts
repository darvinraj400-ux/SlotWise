import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  addMonthsToKey,
  dayBounds,
  formatDateKey,
  formatDateRange,
  formatMoney,
  formatTime,
  formatTimeOfDay,
  getIsoWeekday,
  getMonthGrid,
  getWeekKeys,
  isValidCurrencyCode,
  isValidTimeZone,
  localDateTimeToInstant,
  minutesToTimeInput,
  parseDateKey,
  reportingRange,
  timeInputToMinutes,
  timeStringToMinutes,
  todayDateKey,
} from "@/lib/time";

const KL = "Asia/Kuala_Lumpur";

describe("date keys", () => {
  it("parses valid keys and rejects malformed or impossible dates", () => {
    expect(parseDateKey("2026-10-28")).toEqual({ year: 2026, month: 10, day: 28 });
    expect(parseDateKey("2026-02-29")).toBeNull();
    expect(parseDateKey("2028-02-29")).toEqual({ year: 2028, month: 2, day: 29 });
    expect(parseDateKey("2026-13-01")).toBeNull();
    expect(parseDateKey("2026-00-10")).toBeNull();
    expect(parseDateKey("2026-1-1")).toBeNull();
    expect(parseDateKey("1899-12-31")).toBeNull();
    expect(parseDateKey("")).toBeNull();
    expect(parseDateKey(null)).toBeNull();
  });

  it("formats instants in the business time zone, not the server zone", () => {
    expect(formatDateKey("2026-10-28T17:00:00.000Z", KL)).toBe("2026-10-29");
    expect(formatDateKey("2026-10-28T15:59:59.000Z", KL)).toBe("2026-10-28");
    expect(formatTime("2026-10-28T02:00:00.000Z", KL)).toBe("10:00 AM");
    expect(formatTimeOfDay("13:05:00")).toBe("1:05 PM");
    expect(formatTimeOfDay("00:00")).toBe("12:00 AM");
    expect(formatTimeOfDay("nope")).toBe("—");
  });

  it("derives today's key from the zoned wall clock", () => {
    expect(todayDateKey(KL, new Date("2026-10-28T15:59:00.000Z"))).toBe("2026-10-28");
    expect(todayDateKey(KL, new Date("2026-10-28T16:01:00.000Z"))).toBe("2026-10-29");
  });

  it("adds days and months across month and year boundaries", () => {
    expect(addDaysToKey("2026-12-31", 1, KL)).toBe("2027-01-01");
    expect(addDaysToKey("2026-03-01", -1, KL)).toBe("2026-02-28");
    expect(addMonthsToKey("2026-01-31", 1, KL)).toBe("2026-02-28");
    expect(addMonthsToKey("2026-11-30", 1, KL)).toBe("2026-12-30");
  });
});

describe("calendar grids", () => {
  it("builds Monday-first weeks", () => {
    expect(getWeekKeys("2026-10-28", KL)).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
    expect(getIsoWeekday("2026-10-28", KL)).toBe(3);
    expect(getIsoWeekday("2026-10-25", KL)).toBe(7);
  });

  it("builds six full weeks for the month view", () => {
    const grid = getMonthGrid("2026-10-28", KL);
    expect(grid).toHaveLength(42);
    expect(grid[0]).toEqual({ dateKey: "2026-09-28", inMonth: false });
    expect(grid[3]).toEqual({ dateKey: "2026-10-01", inMonth: true });
    expect(grid.filter((day) => day.inMonth)).toHaveLength(31);
    expect(grid[grid.length - 1]?.dateKey).toBe("2026-11-08");
  });

  it("uses half-open day bounds", () => {
    const { start, end } = dayBounds("2026-10-28", KL);
    // dayBounds returns TZDate instances, so compare instants rather than ISO strings.
    expect(start.getTime()).toBe(Date.parse("2026-10-27T16:00:00.000Z"));
    expect(end.getTime()).toBe(Date.parse("2026-10-28T16:00:00.000Z"));
  });
});

describe("local wall-clock conversion", () => {
  it("converts Asia/Kuala_Lumpur times to UTC instants", () => {
    expect(localDateTimeToInstant("2026-10-28", "10:00", KL)?.toISOString()).toBe(
      "2026-10-28T02:00:00.000Z",
    );
    expect(localDateTimeToInstant("2026-10-28", "00:00", KL)?.toISOString()).toBe(
      "2026-10-27T16:00:00.000Z",
    );
    expect(localDateTimeToInstant("2026-10-28", "23:59", KL)?.toISOString()).toBe(
      "2026-10-28T15:59:00.000Z",
    );
  });

  it("rejects non-existent spring-forward wall times", () => {
    expect(localDateTimeToInstant("2026-03-08", "02:30", "America/New_York")).toBeNull();
    expect(
      localDateTimeToInstant("2026-03-08", "03:30", "America/New_York")?.toISOString(),
    ).toBe("2026-03-08T07:30:00.000Z");
    expect(localDateTimeToInstant("2026-10-04", "02:30", "Australia/Sydney")).toBeNull();
    expect(
      localDateTimeToInstant("2026-10-04", "03:30", "Australia/Sydney")?.toISOString(),
    ).toBe("2026-10-03T16:30:00.000Z");
  });

  it("produces a 23-hour day across Sydney spring-forward", () => {
    const spring = dayBounds("2026-10-04", "Australia/Sydney");
    expect(spring.end.getTime() - spring.start.getTime()).toBe(23 * 60 * 60 * 1000);
    const ordinary = dayBounds("2026-10-05", "Australia/Sydney");
    expect(ordinary.end.getTime() - ordinary.start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("rejects invalid inputs", () => {
    expect(localDateTimeToInstant("2026-02-30", "10:00", KL)).toBeNull();
    expect(localDateTimeToInstant("2026-10-28", "24:00", KL)).toBeNull();
    expect(localDateTimeToInstant("2026-10-28", "9:00", KL)).toBeNull();
  });
});

describe("time-of-day helpers", () => {
  it("parses database and input time formats", () => {
    expect(timeStringToMinutes("09:30")).toBe(570);
    expect(timeStringToMinutes("09:30:45.123")).toBe(570);
    expect(timeStringToMinutes("24:00")).toBeNull();
    expect(timeStringToMinutes("9:30")).toBeNull();
    expect(timeInputToMinutes("23:59")).toBe(1439);
    expect(timeInputToMinutes("23:60")).toBeNull();
  });

  it("wraps minute values into a 24-hour clock", () => {
    expect(minutesToTimeInput(0)).toBe("00:00");
    expect(minutesToTimeInput(570)).toBe("09:30");
    expect(minutesToTimeInput(1440)).toBe("00:00");
    expect(minutesToTimeInput(-30)).toBe("23:30");
  });
});

describe("reporting ranges", () => {
  const now = new Date("2026-10-30T04:00:00.000Z");

  it("starts the month at the first local day", () => {
    const range = reportingRange("month", KL, now);
    expect(range.fromKey).toBe("2026-10-01");
    expect(range.toKey).toBe("2026-10-30");
    expect(range.start.getTime()).toBe(Date.parse("2026-09-30T16:00:00.000Z"));
    expect(range.endExclusive.getTime()).toBe(Date.parse("2026-10-30T16:00:00.000Z"));
    expect(range.label).toBe("Oct 1 – Oct 30, 2026");
  });

  it("counts trailing presets inclusively", () => {
    expect(reportingRange("7d", KL, now).fromKey).toBe("2026-10-24");
    expect(reportingRange("30d", KL, now).fromKey).toBe("2026-10-01");
    expect(reportingRange("90d", KL, now).fromKey).toBe("2026-08-02");
  });

  it("formats cross-year ranges with both years", () => {
    expect(
      formatDateRange("2025-12-20T00:00:00.000Z", "2026-01-10T00:00:00.000Z", KL),
    ).toContain("2025");
    expect(
      formatDateRange("2025-12-20T00:00:00.000Z", "2026-01-10T00:00:00.000Z", KL),
    ).toContain("2026");
  });
});

describe("currency and time zone validation", () => {
  it("validates IANA zones", () => {
    expect(isValidTimeZone(KL)).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });

  it("requires uppercase ISO-shaped currency codes", () => {
    expect(isValidCurrencyCode("MYR")).toBe(true);
    expect(isValidCurrencyCode("SGD")).toBe(true);
    expect(isValidCurrencyCode("myr")).toBe(false);
    expect(isValidCurrencyCode("US")).toBe(false);
    expect(isValidCurrencyCode("123")).toBe(false);
  });

  it("formats money and handles bad values", () => {
    const formatted = formatMoney(1234.5, "MYR");
    expect(formatted).toContain("1,234.50");
    expect(formatted).toMatch(/^RM/);
    expect(formatMoney(null, "MYR")).toContain("0.00");
    expect(formatMoney("not-a-number", "MYR")).toBe("—");
  });
});
