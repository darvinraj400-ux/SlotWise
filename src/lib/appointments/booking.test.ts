import { describe, expect, it } from "vitest";
import {
  computeEndAt,
  formatDuration,
  formatSlotRange,
  isSlotBlocked,
  isWithinWorkingHours,
  minuteOfDayInZone,
  rangesOverlap,
} from "@/lib/appointments/booking";
import { formatDateKey } from "@/lib/time";

const KL = "Asia/Kuala_Lumpur";

describe("computeEndAt", () => {
  it("adds the service duration in real minutes", () => {
    expect(computeEndAt("2026-10-28T02:00:00.000Z", 45).toISOString()).toBe(
      "2026-10-28T02:45:00.000Z",
    );
  });

  it("accounts for DST shifts because it operates on instants", () => {
    const start = new Date("2026-10-03T15:30:00.000Z"); // 01:30 Sydney, before spring-forward
    const end = computeEndAt(start, 60);
    expect(formatDateKey(end, "Australia/Sydney")).toBe("2026-10-04");
    expect(formatDateKey(start, "Australia/Sydney")).toBe("2026-10-04");
    expect(end.getTime() - start.getTime()).toBe(60 * 60 * 1000);
    expect(end.toISOString()).toBe("2026-10-03T16:30:00.000Z"); // 03:30 local after the jump
  });
});

describe("minuteOfDayInZone", () => {
  it("reads the local wall-clock minute", () => {
    expect(minuteOfDayInZone("2026-10-28T02:00:00.000Z", KL)).toBe(600);
    expect(minuteOfDayInZone("2026-10-27T16:00:00.000Z", KL)).toBe(0);
    expect(minuteOfDayInZone("2026-10-28T15:59:00.000Z", KL)).toBe(1439);
  });
});

describe("isWithinWorkingHours", () => {
  const base = {
    dateKey: "2026-10-28",
    timeZone: KL,
    workingStart: "09:00:00",
    workingEnd: "17:00:00",
  };

  it("accepts slots that exactly touch the boundaries", () => {
    expect(
      isWithinWorkingHours({
        ...base,
        startAt: "2026-10-28T01:00:00.000Z",
        endAt: "2026-10-28T01:45:00.000Z",
      }),
    ).toBe(true);
    expect(
      isWithinWorkingHours({
        ...base,
        startAt: "2026-10-28T08:15:00.000Z",
        endAt: "2026-10-28T09:00:00.000Z",
      }),
    ).toBe(true);
  });

  it("rejects slots outside the working interval", () => {
    expect(
      isWithinWorkingHours({
        ...base,
        startAt: "2026-10-28T00:45:00.000Z",
        endAt: "2026-10-28T01:30:00.000Z",
      }),
    ).toBe(false);
    expect(
      isWithinWorkingHours({
        ...base,
        startAt: "2026-10-28T08:30:00.000Z",
        endAt: "2026-10-28T09:15:00.000Z",
      }),
    ).toBe(false);
  });

  it("rejects slots that cross the local day boundary", () => {
    expect(
      isWithinWorkingHours({
        ...base,
        dateKey: "2026-10-28",
        workingEnd: "23:59:00",
        startAt: "2026-10-28T15:30:00.000Z",
        endAt: "2026-10-28T16:15:00.000Z",
      }),
    ).toBe(false);
  });

  it("rejects invalid working intervals", () => {
    expect(
      isWithinWorkingHours({
        ...base,
        workingStart: "17:00:00",
        workingEnd: "09:00:00",
        startAt: "2026-10-28T01:00:00.000Z",
        endAt: "2026-10-28T01:45:00.000Z",
      }),
    ).toBe(false);
    expect(
      isWithinWorkingHours({
        ...base,
        workingStart: "not-a-time",
        startAt: "2026-10-28T01:00:00.000Z",
        endAt: "2026-10-28T01:45:00.000Z",
      }),
    ).toBe(false);
  });
});

describe("rangesOverlap", () => {
  const aStart = "2026-10-28T02:00:00.000Z";
  const aEnd = "2026-10-28T02:45:00.000Z";

  it("allows back-to-back ranges (half-open)", () => {
    expect(
      rangesOverlap(aStart, aEnd, "2026-10-28T02:45:00.000Z", "2026-10-28T03:30:00.000Z"),
    ).toBe(false);
    expect(
      rangesOverlap(aStart, aEnd, "2026-10-28T01:15:00.000Z", "2026-10-28T02:00:00.000Z"),
    ).toBe(false);
  });

  it("detects partial, contained, and containing overlaps", () => {
    expect(
      rangesOverlap(aStart, aEnd, "2026-10-28T02:30:00.000Z", "2026-10-28T03:00:00.000Z"),
    ).toBe(true);
    expect(
      rangesOverlap(aStart, aEnd, "2026-10-28T02:10:00.000Z", "2026-10-28T02:20:00.000Z"),
    ).toBe(true);
    expect(
      rangesOverlap(aStart, aEnd, "2026-10-28T01:00:00.000Z", "2026-10-28T04:00:00.000Z"),
    ).toBe(true);
    expect(
      rangesOverlap(aStart, aEnd, "2026-10-28T03:00:00.000Z", "2026-10-28T04:00:00.000Z"),
    ).toBe(false);
  });

  it("treats zero-length ranges as non-overlapping", () => {
    expect(
      rangesOverlap(aStart, aStart, "2026-10-28T01:00:00.000Z", "2026-10-28T02:00:00.000Z"),
    ).toBe(false);
  });
});

describe("isSlotBlocked", () => {
  const busy = [
    { startAt: "2026-10-28T02:00:00.000Z", endAt: "2026-10-28T02:45:00.000Z" },
    { startAt: "2026-10-28T05:00:00.000Z", endAt: "2026-10-28T06:00:00.000Z" },
  ];

  it("blocks overlapping intervals but allows adjacency", () => {
    expect(
      isSlotBlocked(
        new Date("2026-10-28T02:30:00.000Z"),
        new Date("2026-10-28T03:00:00.000Z"),
        busy,
      ),
    ).toBe(true);
    expect(
      isSlotBlocked(
        new Date("2026-10-28T02:45:00.000Z"),
        new Date("2026-10-28T03:30:00.000Z"),
        busy,
      ),
    ).toBe(false);
    expect(
      isSlotBlocked(
        new Date("2026-10-28T04:00:00.000Z"),
        new Date("2026-10-28T05:00:00.000Z"),
        busy,
      ),
    ).toBe(false);
  });
});

describe("formatting", () => {
  it("formats durations", () => {
    expect(formatDuration(5)).toBe("5 min");
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(90)).toBe("1 hr 30 min");
    expect(formatDuration(125)).toBe("2 hr 5 min");
  });

  it("formats a zoned slot range", () => {
    expect(
      formatSlotRange(
        "2026-10-28T02:00:00.000Z",
        "2026-10-28T02:45:00.000Z",
        KL,
      ),
    ).toBe("10:00 AM – 10:45 AM");
  });
});
