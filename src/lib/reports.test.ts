import { describe, expect, it } from "vitest";
import {
  appointmentSummary,
  countByStatus,
  percentage,
  serviceBreakdown,
  staffBreakdown,
  statusChartData,
  sumRevenue,
  type ReportableAppointment,
} from "@/lib/reports";

const appointment = (
  overrides: Partial<ReportableAppointment> & Pick<ReportableAppointment, "status">,
): ReportableAppointment => ({
  price_amount_snapshot: 50,
  service_name_snapshot: "Signature cut",
  staff_id: "staff-a",
  start_at: "2026-10-28T02:00:00.000Z",
  staff: { full_name: "Maya Chen" },
  ...overrides,
});

const fixtures: ReportableAppointment[] = [
  appointment({ status: "completed", price_amount_snapshot: 75 }),
  appointment({ status: "completed", price_amount_snapshot: 125.5 }),
  appointment({ status: "cancelled", price_amount_snapshot: 75 }),
  appointment({ status: "no_show", staff_id: "staff-b", staff: { full_name: "Jon Lee" } }),
  appointment({
    status: "confirmed",
    service_name_snapshot: "Beard trim",
    price_amount_snapshot: 25,
    staff_id: "staff-b",
    staff: { full_name: "Jon Lee" },
  }),
];

describe("revenue", () => {
  it("counts only completed appointments and rounds to cents", () => {
    expect(sumRevenue(fixtures)).toBe(200.5);
    expect(sumRevenue([])).toBe(0);
  });

  it("sums snapshots rather than current catalog prices", () => {
    expect(
      sumRevenue([appointment({ status: "completed", price_amount_snapshot: 0.1 })]),
    ).toBe(0.1);
  });
});

describe("status counts", () => {
  it("includes zeroes for every status", () => {
    expect(countByStatus(fixtures)).toEqual({
      pending: 0,
      confirmed: 1,
      in_progress: 0,
      completed: 2,
      cancelled: 1,
      no_show: 1,
    });
  });

  it("provides chart rows in canonical order", () => {
    const chart = statusChartData(fixtures);
    expect(chart.map((row) => row.status)).toEqual([
      "pending",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "no_show",
    ]);
    expect(chart.find((row) => row.status === "completed")?.count).toBe(2);
  });
});

describe("breakdowns", () => {
  it("groups services by snapshot name and sorts by bookings", () => {
    const rows = serviceBreakdown(fixtures);
    expect(rows[0]).toEqual({
      name: "Signature cut",
      bookings: 4,
      completed: 2,
      cancelled: 1,
      revenue: 200.5,
    });
    expect(rows[1]).toEqual({
      name: "Beard trim",
      bookings: 1,
      completed: 0,
      cancelled: 0,
      revenue: 0,
    });
  });

  it("groups staff with completed, cancelled, no-show, and revenue totals", () => {
    const rows = staffBreakdown(fixtures);
    expect(rows).toEqual([
      {
        staffId: "staff-a",
        name: "Maya Chen",
        bookings: 3,
        completed: 2,
        cancelled: 1,
        noShow: 0,
        revenue: 200.5,
      },
      {
        staffId: "staff-b",
        name: "Jon Lee",
        bookings: 2,
        completed: 0,
        cancelled: 0,
        noShow: 1,
        revenue: 0,
      },
    ]);
  });

  it("falls back to a placeholder when a staff relation is missing", () => {
    const rows = staffBreakdown([
      appointment({ status: "pending", staff: null, staff_id: "deleted" }),
    ]);
    expect(rows[0]?.name).toBe("Unassigned");
  });
});

describe("summaries and percentages", () => {
  it("summarizes totals for the selected range", () => {
    expect(appointmentSummary(fixtures)).toMatchObject({
      total: 5,
      completed: 2,
      cancelled: 1,
      noShow: 1,
      revenue: 200.5,
    });
  });

  it("returns whole percentages and handles empty totals", () => {
    expect(percentage(1, 3)).toBe(33);
    expect(percentage(2, 3)).toBe(67);
    expect(percentage(0, 0)).toBe(0);
    expect(percentage(5, 0)).toBe(0);
  });
});
