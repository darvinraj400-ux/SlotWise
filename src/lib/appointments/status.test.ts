import { describe, expect, it } from "vitest";
import {
  ALLOWED_TRANSITIONS,
  APPOINTMENT_STATUSES,
  canPerformAction,
  canTransition,
  getStatusActions,
  isAppointmentStatus,
  isTerminalStatus,
  TERMINAL_STATUSES,
} from "@/lib/appointments/status";

const start = "2026-10-28T02:00:00.000Z";
const end = "2026-10-28T02:45:00.000Z";
const minutes = (value: number) => new Date(Date.parse(start) + value * 60_000);

describe("transition matrix", () => {
  it("matches the documented workflow", () => {
    expect(ALLOWED_TRANSITIONS).toEqual({
      pending: ["confirmed", "cancelled"],
      confirmed: ["in_progress", "cancelled", "no_show"],
      in_progress: ["completed"],
      completed: [],
      cancelled: [],
      no_show: [],
    });
  });

  it("accepts only registered statuses", () => {
    for (const status of APPOINTMENT_STATUSES) {
      expect(isAppointmentStatus(status)).toBe(true);
      expect(isTerminalStatus(status)).toBe(TERMINAL_STATUSES.includes(status));
    }
    expect(isAppointmentStatus("archived")).toBe(false);
  });

  it("guards transitions in both directions", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("pending", "in_progress")).toBe(false);
    expect(canTransition("confirmed", "completed")).toBe(false);
    expect(canTransition("in_progress", "completed")).toBe(true);
    expect(canTransition("completed", "cancelled")).toBe(false);
    expect(canTransition("cancelled", "pending")).toBe(false);
    expect(canTransition("no_show", "confirmed")).toBe(false);
  });
});

describe("getStatusActions timing", () => {
  it("offers confirm and cancel for a pending booking", () => {
    const actions = getStatusActions("pending", start, end, minutes(-240));
    expect(actions.map((action) => action.to)).toEqual(["confirmed", "cancelled"]);
    expect(actions.every((action) => !action.disabledReason)).toBe(true);
  });

  it("prevents starting more than 15 minutes early", () => {
    const actions = getStatusActions("confirmed", start, end, minutes(-30));
    expect(actions.find((action) => action.to === "in_progress")?.disabledReason).toContain(
      "15 minutes",
    );
    expect(actions.find((action) => action.to === "no_show")?.disabledReason).toContain(
      "after the scheduled start",
    );
    expect(actions.find((action) => action.to === "cancelled")?.disabledReason).toBeUndefined();
  });

  it("opens the start window 15 minutes before the start", () => {
    const actions = getStatusActions("confirmed", start, end, minutes(-10));
    expect(actions.find((action) => action.to === "in_progress")?.disabledReason).toBeUndefined();
    expect(actions.find((action) => action.to === "no_show")?.disabledReason).toBeDefined();
  });

  it("allows no-show from the scheduled start", () => {
    const actions = getStatusActions("confirmed", start, end, minutes(1));
    expect(actions.find((action) => action.to === "no_show")?.disabledReason).toBeUndefined();
    expect(actions.find((action) => action.to === "in_progress")?.disabledReason).toBeUndefined();
  });

  it("closes the start window after the appointment ends", () => {
    const actions = getStatusActions("confirmed", start, end, minutes(60));
    expect(actions.find((action) => action.to === "in_progress")?.disabledReason).toContain(
      "already ended",
    );
    expect(actions.find((action) => action.to === "no_show")?.disabledReason).toBeUndefined();
  });

  it("only allows completion while in progress", () => {
    const actions = getStatusActions("in_progress", start, end, minutes(10));
    expect(actions.map((action) => action.to)).toEqual(["completed"]);
  });

  it("offers no actions for terminal appointments", () => {
    for (const status of TERMINAL_STATUSES) {
      expect(getStatusActions(status, start, end, minutes(10))).toEqual([]);
    }
  });
});

describe("canPerformAction", () => {
  it("mirrors the disabled reasons", () => {
    expect(canPerformAction("confirmed", "in_progress", start, end, minutes(-30))).toBe(false);
    expect(canPerformAction("confirmed", "in_progress", start, end, minutes(-5))).toBe(true);
    expect(canPerformAction("confirmed", "no_show", start, end, minutes(-5))).toBe(false);
    expect(canPerformAction("confirmed", "cancelled", start, end, minutes(-5))).toBe(true);
    expect(canPerformAction("pending", "confirmed", start, end, minutes(-5))).toBe(true);
    expect(canPerformAction("completed", "cancelled", start, end, minutes(200))).toBe(false);
  });
});
