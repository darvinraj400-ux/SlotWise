import { describe, expect, it } from "vitest";
import { getAvailableSlots } from "@/lib/appointments/availability";

const KL = "Asia/Kuala_Lumpur";

describe("getAvailableSlots", () => {
  const base = {
    dateKey: "2026-10-28",
    timeZone: KL,
    workingStart: "09:00:00",
    workingEnd: "17:00:00",
    durationMinutes: 45,
    busy: [],
    now: new Date("2026-10-27T00:00:00.000Z"),
  };

  it("generates every 15-minute start that fits the day", () => {
    const slots = getAvailableSlots(base);
    expect(slots).toHaveLength(30);
    expect(slots[0]).toMatchObject({
      startTime: "09:00",
      label: "9:00 AM",
      endLabel: "9:45 AM",
      startAt: "2026-10-28T01:00:00.000Z",
      endAt: "2026-10-28T01:45:00.000Z",
    });
    expect(slots.at(-1)).toMatchObject({
      startTime: "16:15",
      label: "4:15 PM",
      endLabel: "5:00 PM",
    });
  });

  it("removes starts that overlap a booking while keeping adjacency", () => {
    const slots = getAvailableSlots({
      ...base,
      busy: [
        {
          startAt: "2026-10-28T02:00:00.000Z",
          endAt: "2026-10-28T02:45:00.000Z",
        },
      ],
    });
    const starts = slots.map((slot) => slot.startTime);
    expect(slots).toHaveLength(25);
    expect(starts).toContain("09:15");
    expect(starts).toContain("10:45");
    expect(starts).not.toContain("09:30");
    expect(starts).not.toContain("09:45");
    expect(starts).not.toContain("10:00");
    expect(starts).not.toContain("10:15");
    expect(starts).not.toContain("10:30");
  });

  it("hides slots that start in the past", () => {
    const slots = getAvailableSlots({
      ...base,
      now: new Date("2026-10-28T03:00:00.000Z"), // 11:00 local
    });
    expect(slots[0]?.startTime).toBe("11:15");
    for (const slot of slots) {
      expect(new Date(slot.startAt).getTime()).toBeGreaterThan(
        new Date("2026-10-28T03:00:00.000Z").getTime(),
      );
    }
  });

  it("returns nothing when the workday cannot fit the service", () => {
    expect(
      getAvailableSlots({ ...base, workingStart: "09:00:00", workingEnd: "09:30:00" }),
    ).toEqual([]);
    expect(getAvailableSlots({ ...base, durationMinutes: 0 })).toEqual([]);
    expect(
      getAvailableSlots({ ...base, workingStart: "17:00:00", workingEnd: "09:00:00" }),
    ).toEqual([]);
  });

  it("supports custom step sizes", () => {
    const slots = getAvailableSlots({ ...base, stepMinutes: 60 });
    expect(slots.map((slot) => slot.startTime)).toEqual([
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
    ]);
  });

  it("skips wall-clock times erased by spring-forward", () => {
    const slots = getAvailableSlots({
      dateKey: "2026-10-04",
      timeZone: "Australia/Sydney",
      workingStart: "00:00:00",
      workingEnd: "06:00:00",
      durationMinutes: 60,
      busy: [],
      now: new Date("2026-10-03T00:00:00.000Z"),
      stepMinutes: 30,
    });
    const starts = slots.map((slot) => slot.startTime);
    expect(slots).toHaveLength(9);
    expect(starts).not.toContain("02:00");
    expect(starts).not.toContain("02:30");
    expect(starts).toContain("03:00");
    expect(starts).toContain("05:00");
    expect(
      slots.find((slot) => slot.startTime === "03:00")?.startAt,
    ).toBe("2026-10-03T16:00:00.000Z");
  });

  it("deduplicates instants created by fall-back clocks", () => {
    const slots = getAvailableSlots({
      dateKey: "2026-04-05",
      timeZone: "Australia/Sydney",
      workingStart: "00:00:00",
      workingEnd: "04:00:00",
      durationMinutes: 30,
      busy: [],
      now: new Date("2026-04-04T00:00:00.000Z"),
      stepMinutes: 30,
    });
    const instants = slots.map((slot) => slot.startAt);
    expect(new Set(instants).size).toBe(instants.length);
  });
});
