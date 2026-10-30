import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppointmentWithDetails } from "@/lib/data/appointments";
import type { TypedSupabaseClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));

const { getAppointmentsInRange } = await import("@/lib/data/appointments");

function makeRows(count: number): AppointmentWithDetails[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `appointment-${String(index).padStart(4, "0")}`,
    start_at: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
  })) as unknown as AppointmentWithDetails[];
}

function createFakeSupabase(rows: AppointmentWithDetails[]) {
  const ranges: { from: number; to: number }[] = [];
  const filters: [string, unknown][] = [];
  const orders: [string, unknown][] = [];

  const query = {
    select: () => query,
    eq: (column: string, value: unknown) => {
      filters.push([column, value]);
      return query;
    },
    gte: (column: string, value: unknown) => {
      filters.push([column, value]);
      return query;
    },
    lt: (column: string, value: unknown) => {
      filters.push([column, value]);
      return query;
    },
    order: (column: string, options: unknown) => {
      orders.push([column, options]);
      return query;
    },
    range: async (from: number, to: number) => {
      ranges.push({ from, to });
      return { data: rows.slice(from, to + 1), error: null };
    },
  };

  return {
    client: {
      from: (table: string) => {
        expect(table).toBe("appointments");
        return query;
      },
    } as unknown as TypedSupabaseClient,
    ranges,
    filters,
    orders,
  };
}

const start = new Date("2026-01-01T00:00:00.000Z");
const end = new Date("2026-02-01T00:00:00.000Z");
const userId = "user-1";

describe("getAppointmentsInRange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stops after the final short batch and returns every row", async () => {
    const fake = createFakeSupabase(makeRows(2345));

    const result = await getAppointmentsInRange(fake.client, userId, start, end);

    expect(result).toEqual({
      appointments: expect.any(Array),
      exceeded: false,
      limit: null,
    });
    expect(result.appointments).toHaveLength(2345);
    expect(fake.ranges).toEqual([
      { from: 0, to: 999 },
      { from: 1000, to: 1999 },
      { from: 2000, to: 2999 },
    ]);
    expect(result.appointments[2344]?.id).toBe("appointment-2344");
  });

  it("handles an exact batch boundary without skipping or duplicating rows", async () => {
    const fake = createFakeSupabase(makeRows(1000));

    const result = await getAppointmentsInRange(fake.client, userId, start, end);

    expect(result.appointments).toHaveLength(1000);
    expect(result.exceeded).toBe(false);
    expect(result.appointments[0]?.id).toBe("appointment-0000");
    expect(result.appointments[999]?.id).toBe("appointment-0999");
    expect(fake.ranges).toEqual([
      { from: 0, to: 999 },
      { from: 1000, to: 1999 },
    ]);
  });

  it("accepts a result exactly at the configured maximum", async () => {
    const fake = createFakeSupabase(makeRows(1000));

    const result = await getAppointmentsInRange(fake.client, userId, start, end, {
      maxRows: 1000,
    });

    expect(result.appointments).toHaveLength(1000);
    expect(result.exceeded).toBe(false);
    expect(result.limit).toBe(1000);
    expect(fake.ranges).toEqual([
      { from: 0, to: 999 },
      { from: 1000, to: 1000 },
    ]);
  });

  it("reports an exceeded maximum without presenting the result as complete", async () => {
    const fake = createFakeSupabase(makeRows(1001));

    const result = await getAppointmentsInRange(fake.client, userId, start, end, {
      maxRows: 1000,
    });

    expect(result.exceeded).toBe(true);
    expect(result.limit).toBe(1000);
    expect(result.appointments).toHaveLength(1000);
    expect(fake.ranges).toEqual([
      { from: 0, to: 999 },
      { from: 1000, to: 1000 },
    ]);
  });

  it("reports an exceeded maximum when the first batch is larger than the limit", async () => {
    const fake = createFakeSupabase(makeRows(6));

    const result = await getAppointmentsInRange(fake.client, userId, start, end, {
      maxRows: 5,
    });

    expect(result).toEqual({ appointments: [], exceeded: true, limit: 5 });
    expect(fake.ranges).toEqual([{ from: 0, to: 5 }]);
  });

  it("rejects a non-positive or fractional maximum", async () => {
    const fake = createFakeSupabase([]);

    for (const maxRows of [0, -1, 1.5]) {
      await expect(
        getAppointmentsInRange(fake.client, userId, start, end, { maxRows }),
      ).rejects.toThrow(/positive integer/);
    }
  });

  it("applies tenant, date-range, staff, and stable ordering filters", async () => {
    const fake = createFakeSupabase([]);

    await getAppointmentsInRange(fake.client, userId, start, end, {
      staffId: "staff-1",
    });

    expect(fake.filters).toEqual([
      ["user_id", userId],
      ["start_at", start.toISOString()],
      ["start_at", end.toISOString()],
      ["staff_id", "staff-1"],
    ]);
    expect(fake.orders).toEqual([
      ["start_at", { ascending: true }],
      ["id", { ascending: true }],
    ]);
  });
});
