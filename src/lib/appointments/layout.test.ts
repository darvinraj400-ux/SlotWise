import { describe, expect, it } from "vitest";
import { layoutIntervals } from "@/lib/appointments/layout";

const at = (hour: number, minute = 0) =>
  new Date(Date.UTC(2026, 9, 28, hour, minute)).toISOString();

describe("layoutIntervals", () => {
  it("keeps sequential bookings in a single lane", () => {
    const layout = layoutIntervals([
      { startAt: at(1), endAt: at(2), value: "a" },
      { startAt: at(2), endAt: at(3), value: "b" },
    ]);
    expect(layout).toHaveLength(2);
    expect(layout.map((item) => item.lane)).toEqual([0, 0]);
    expect(layout.map((item) => item.laneCount)).toEqual([1, 1]);
  });

  it("assigns separate lanes to overlapping bookings", () => {
    const layout = layoutIntervals([
      { startAt: at(1), endAt: at(2), value: "a" },
      { startAt: at(1, 30), endAt: at(2, 30), value: "b" },
      { startAt: at(1, 45), endAt: at(3), value: "c" },
    ]);
    expect(layout.map((item) => item.value)).toEqual(["a", "b", "c"]);
    expect(layout.map((item) => item.lane)).toEqual([0, 1, 2]);
    expect(layout.map((item) => item.laneCount)).toEqual([3, 3, 3]);
  });

  it("reuses lanes once they are free", () => {
    const layout = layoutIntervals([
      { startAt: at(1), endAt: at(3), value: "long" },
      { startAt: at(1), endAt: at(2), value: "short-a" },
      { startAt: at(2), endAt: at(3), value: "short-b" },
    ]);
    expect(layout).toEqual([
      expect.objectContaining({ value: "short-a", lane: 0, laneCount: 2 }),
      expect.objectContaining({ value: "long", lane: 1, laneCount: 2 }),
      expect.objectContaining({ value: "short-b", lane: 0, laneCount: 2 }),
    ]);
  });

  it("splits independent clusters", () => {
    const layout = layoutIntervals([
      { startAt: at(1), endAt: at(2), value: "a" },
      { startAt: at(1, 30), endAt: at(2, 30), value: "b" },
      { startAt: at(2, 30), endAt: at(3, 30), value: "c" },
    ]);
    expect(layout.map((item) => item.laneCount)).toEqual([2, 2, 1]);
    expect(layout.at(-1)).toMatchObject({ value: "c", lane: 0, laneCount: 1 });
  });

  it("sorts input and drops invalid intervals", () => {
    const layout = layoutIntervals([
      { startAt: at(2), endAt: at(3), value: "later" },
      { startAt: "not-a-date", endAt: at(3), value: "invalid" },
      { startAt: at(1), endAt: at(1), value: "empty" },
      { startAt: at(1), endAt: at(2), value: "earlier" },
    ]);
    expect(layout.map((item) => item.value)).toEqual(["earlier", "later"]);
    expect(layout.map((item) => item.lane)).toEqual([0, 0]);
  });
});
