import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDaysToKey, localDateTimeToInstant, todayDateKey } from "@/lib/time";

const URL = process.env.SUPABASE_TEST_URL;
const ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_TEST_SERVICE_KEY;

if (!URL || !ANON_KEY || !SERVICE_KEY) {
  throw new Error(
    "Missing SUPABASE_TEST_* environment variables. Run `npm run test:integration`.",
  );
}

const TIMEZONE = "Asia/Kuala_Lumpur";
const PASSWORD = "Integration123";
const admin = createClient(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Tenant = { email: string; userId: string; client: SupabaseClient };
type Resources = {
  customerId: string;
  serviceId: string;
  staffId: string;
  serviceName: string;
};
type AppointmentRow = {
  id: string;
  user_id: string;
  customer_id: string;
  staff_id: string;
  service_id: string;
  start_at: string;
  end_at: string;
  status: string;
  notes: string | null;
  service_name_snapshot: string;
  duration_minutes_snapshot: number;
  price_amount_snapshot: number;
};

const tenants: Tenant[] = [];

function one<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] ?? null) as T;
  return (data ?? null) as T;
}

function dayKey(offset: number) {
  return addDaysToKey(todayDateKey(TIMEZONE), offset, TIMEZONE);
}

function at(offsetDays: number, time: string) {
  const instant = localDateTimeToInstant(dayKey(offsetDays), time, TIMEZONE);
  if (!instant) throw new Error(`Could not resolve ${time}`);
  return instant;
}

async function createTenant(label: string): Promise<Tenant> {
  const email = `slotwise.it.${label}.${Date.now()}.${Math.random()
    .toString(36)
    .slice(2, 7)}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { business_name: `${label} Studio` },
  });
  if (error || !data.user) throw error ?? new Error("Could not create user");

  const client = createClient(URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (signInError) throw signInError;

  const tenant: Tenant = { email, userId: data.user.id, client };
  tenants.push(tenant);
  return tenant;
}

async function setupResources(
  tenant: Tenant,
  options: {
    duration?: number;
    price?: number;
    workingStart?: string;
    workingEnd?: string;
    workingDays?: number[];
  } = {},
): Promise<Resources> {
  const suffix = Math.random().toString(36).slice(2, 8);
  const customerName = `Customer ${suffix}`;
  const { data: customer, error: customerError } = await tenant.client
    .from("customers")
    .insert({ user_id: tenant.userId, full_name: customerName })
    .select("id")
    .single();
  if (customerError) throw customerError;

  const serviceName = `Service ${suffix}`;
  const { data: service, error: serviceError } = await tenant.client
    .from("services")
    .insert({
      user_id: tenant.userId,
      name: serviceName,
      duration_minutes: options.duration ?? 45,
      price_amount: options.price ?? 75,
    })
    .select("id")
    .single();
  if (serviceError) throw serviceError;

  const { data: staff, error: staffError } = await tenant.client
    .from("staff")
    .insert({ user_id: tenant.userId, full_name: `Staff ${suffix}` })
    .select("id")
    .single();
  if (staffError) throw staffError;

  const days = options.workingDays ?? [1, 2, 3, 4, 5, 6, 7];
  const { error: hoursError } = await tenant.client.from("staff_working_hours").insert(
    days.map((weekday) => ({
      user_id: tenant.userId,
      staff_id: staff.id,
      weekday,
      start_time: options.workingStart ?? "00:00:00",
      end_time: options.workingEnd ?? "23:59:00",
    })),
  );
  if (hoursError) throw hoursError;

  return {
    customerId: customer.id,
    serviceId: service.id,
    staffId: staff.id,
    serviceName,
  };
}

async function createBooking(
  tenant: Tenant,
  resources: Pick<Resources, "customerId" | "serviceId" | "staffId">,
  start: Date,
  notes: string | null = null,
) {
  const { data, error } = await tenant.client.rpc("create_appointment", {
    p_customer_id: resources.customerId,
    p_staff_id: resources.staffId,
    p_service_id: resources.serviceId,
    p_start_at: start.toISOString(),
    p_notes: notes,
  });
  return { appointment: one<AppointmentRow>(data), error };
}

async function rescheduleBooking(
  tenant: Tenant,
  appointmentId: string,
  resources: Pick<Resources, "serviceId" | "staffId">,
  start: Date,
  notes: string | null = null,
) {
  const { data, error } = await tenant.client.rpc("reschedule_appointment", {
    p_appointment_id: appointmentId,
    p_staff_id: resources.staffId,
    p_service_id: resources.serviceId,
    p_start_at: start.toISOString(),
    p_notes: notes,
  });
  return { appointment: one<AppointmentRow>(data), error };
}

async function transition(tenant: Tenant, appointmentId: string, status: string) {
  const { data, error } = await tenant.client.rpc("transition_appointment_status", {
    p_appointment_id: appointmentId,
    p_new_status: status,
  });
  return { appointment: one<AppointmentRow>(data), error };
}

function expectCode(
  result: { error: { code?: string; message?: string } | null },
  code: string,
) {
  expect(result.error, result.error?.message).not.toBeNull();
  expect(result.error?.code).toBe(code);
}

beforeAll(async () => {
  await createTenant("Alpha");
  await createTenant("Beta");
}, 90_000);

afterAll(async () => {
  for (const tenant of tenants) {
    await admin.auth.admin.deleteUser(tenant.userId);
  }
}, 60_000);

const tenantA = () => tenants[0]!;
const tenantB = () => tenants[1]!;

describe("tenant isolation and client write surface", () => {
  it("creates default settings per owner and keeps them private", async () => {
    const a = tenantA();
    const b = tenantB();

    const { data: settings, error } = await a.client
      .from("business_settings")
      .select("user_id, business_name, timezone, currency_code")
      .single();
    expect(error).toBeNull();
    expect(settings).toMatchObject({
      user_id: a.userId,
      business_name: "Alpha Studio",
      timezone: "Asia/Kuala_Lumpur",
      currency_code: "MYR",
    });

    const { data: bSettings } = await b.client
      .from("business_settings")
      .select("user_id");
    expect(bSettings).toEqual([{ user_id: b.userId }]);

    const { data: crossUpdate, error: crossError } = await b.client
      .from("business_settings")
      .update({ business_name: "Hijacked" })
      .eq("user_id", a.userId)
      .select("user_id");
    expect(crossError).toBeNull();
    expect(crossUpdate).toEqual([]);

    const { data: stillAlpha } = await a.client
      .from("business_settings")
      .select("business_name")
      .single();
    expect(stillAlpha?.business_name).toBe("Alpha Studio");

    const { error: invalidZone } = await a.client
      .from("business_settings")
      .update({ timezone: "Mars/Olympus" })
      .eq("user_id", a.userId);
    expectCode({ error: invalidZone }, "22023");
  });

  it("isolates directory records and denies all direct appointment writes", async () => {
    const a = tenantA();
    const b = tenantB();
    const resourcesA = await setupResources(a);
    const resourcesB = await setupResources(b);
    const start = at(1, "09:00");

    const created = await createBooking(a, resourcesA, start);
    expect(created.error).toBeNull();
    expect(created.appointment).not.toBeNull();

    for (const [table, id] of [
      ["customers", resourcesA.customerId],
      ["services", resourcesA.serviceId],
      ["staff", resourcesA.staffId],
      ["appointments", created.appointment!.id],
    ] as const) {
      const { data } = await b.client.from(table).select("id").eq("id", id);
      expect(data, `${table} leaked across tenants`).toEqual([]);
    }

    const { data: crossCustomerUpdate, error: crossUpdateError } = await b.client
      .from("customers")
      .update({ full_name: "Hacked" })
      .eq("id", resourcesA.customerId)
      .select("id");
    expect(crossUpdateError).toBeNull();
    expect(crossCustomerUpdate).toEqual([]);

    const { data: customerAfter } = await a.client
      .from("customers")
      .select("full_name")
      .eq("id", resourcesA.customerId)
      .single();
    expect(customerAfter?.full_name).not.toBe("Hacked");

    const { appointment: crossBooking, error: crossBookingError } = await createBooking(
      a,
      resourcesB,
      at(1, "10:00"),
    );
    expect(crossBooking).toBeNull();
    expectCode({ error: crossBookingError }, "SW006");

    const insertAttempt = await a.client.from("appointments").insert({
      user_id: a.userId,
      customer_id: resourcesA.customerId,
      staff_id: resourcesA.staffId,
      service_id: resourcesA.serviceId,
      start_at: at(1, "11:00").toISOString(),
      end_at: new Date(at(1, "11:00").getTime() + 45 * 60_000).toISOString(),
      status: "pending",
      service_name_snapshot: "Injected",
      duration_minutes_snapshot: 45,
      price_amount_snapshot: 1,
    });
    expectCode({ error: insertAttempt.error }, "42501");

    const updateAttempt = await a.client
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", created.appointment!.id)
      .select("id");
    expectCode({ error: updateAttempt.error }, "42501");

    const deleteAttempt = await a.client
      .from("appointments")
      .delete()
      .eq("id", created.appointment!.id)
      .select("id");
    expectCode({ error: deleteAttempt.error }, "42501");

    const eventInsert = await a.client.from("appointment_events").insert({
      user_id: a.userId,
      appointment_id: created.appointment!.id,
      event_type: "status_changed",
      summary: "Injected event",
    });
    expectCode({ error: eventInsert.error }, "42501");

    const anon = createClient(URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: anonSelectError } = await anon.from("customers").select("id").limit(1);
    expect(anonSelectError).not.toBeNull();

    const { error: anonRpcError } = await anon.rpc("create_appointment", {
      p_customer_id: resourcesA.customerId,
      p_staff_id: resourcesA.staffId,
      p_service_id: resourcesA.serviceId,
      p_start_at: at(1, "12:00").toISOString(),
      p_notes: null,
    });
    expect(anonRpcError).not.toBeNull();
  });
});

describe("appointment creation", () => {
  it("stores server-computed times and immutable snapshots with an audit event", async () => {
    const a = tenantA();
    const resources = await setupResources(a, { duration: 45, price: 75 });
    const start = at(1, "10:00");

    const { appointment, error } = await createBooking(
      a,
      resources,
      start,
      "  First visit  ",
    );
    expect(error).toBeNull();
    expect(appointment).toMatchObject({
      status: "pending",
      notes: "First visit",
      service_name_snapshot: resources.serviceName,
      duration_minutes_snapshot: 45,
    });
    expect(Number(appointment!.price_amount_snapshot)).toBe(75);
    expect(new Date(appointment!.end_at).getTime()).toBe(start.getTime() + 45 * 60_000);

    const { data: events } = await a.client
      .from("appointment_events")
      .select("event_type, to_status, summary")
      .eq("appointment_id", appointment!.id);
    expect(events).toEqual([
      {
        event_type: "created",
        to_status: "pending",
        summary: "Appointment created",
      },
    ]);

    await a.client
      .from("services")
      .update({ name: "Renamed service", price_amount: 999, duration_minutes: 90 })
      .eq("id", resources.serviceId);

    const { data: afterEdit } = await a.client
      .from("appointments")
      .select(
        "service_name_snapshot, duration_minutes_snapshot, price_amount_snapshot, start_at, end_at",
      )
      .eq("id", appointment!.id)
      .single();
    expect(afterEdit).toMatchObject({
      service_name_snapshot: resources.serviceName,
      duration_minutes_snapshot: 45,
    });
    expect(new Date(afterEdit!.start_at).getTime()).toBe(start.getTime());
    expect(Number(afterEdit?.price_amount_snapshot)).toBe(75);
  });

  it("allows back-to-back bookings, rejects overlaps, and frees cancelled slots", async () => {
    const a = tenantA();
    const resources = await setupResources(a);
    const first = await createBooking(a, resources, at(1, "10:00"));
    const second = await createBooking(a, resources, at(1, "10:45"));
    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
    expect(new Date(second.appointment!.start_at).getTime()).toBe(
      new Date(first.appointment!.end_at).getTime(),
    );

    const overlap = await createBooking(a, resources, at(1, "10:30"));
    expect(overlap.appointment).toBeNull();
    expectCode(overlap, "SW001");

    const { data: blockedSlots } = await a.client
      .from("appointments")
      .select("id")
      .eq("staff_id", resources.staffId)
      .eq("start_at", at(1, "10:30").toISOString());
    expect(blockedSlots).toEqual([]);

    const cancelled = await transition(a, first.appointment!.id, "cancelled");
    expect(cancelled.error).toBeNull();
    expect(cancelled.appointment?.status).toBe("cancelled");

    const rebooked = await createBooking(a, resources, at(1, "10:00"));
    expect(rebooked.error).toBeNull();
    expect(rebooked.appointment?.status).toBe("pending");
  });

  it("validates working hours, time off, active records, and ownership without partial writes", async () => {
    const a = tenantA();
    const b = tenantB();
    const resources = await setupResources(a, {
      workingStart: "09:00:00",
      workingEnd: "17:00:00",
    });
    const otherTenantResources = await setupResources(b);

    const { count: beforeCount } = await a.client
      .from("appointments")
      .select("id", { count: "exact", head: true });
    const { count: beforeEvents } = await a.client
      .from("appointment_events")
      .select("id", { count: "exact", head: true });

    const past = new Date(Date.now() - 60 * 60 * 1000);
    expectCode(await createBooking(a, resources, past), "SW002");
    expectCode(await createBooking(a, resources, at(1, "08:00")), "SW003");
    expectCode(await createBooking(a, resources, at(1, "17:00")), "SW003");

    const timeOffStart = at(1, "13:00");
    const { error: timeOffError } = await a.client.from("staff_time_off").insert({
      user_id: a.userId,
      staff_id: resources.staffId,
      starts_at: timeOffStart.toISOString(),
      ends_at: new Date(timeOffStart.getTime() + 60 * 60_000).toISOString(),
      reason: "Dentist",
    });
    expect(timeOffError).toBeNull();
    expectCode(await createBooking(a, resources, at(1, "13:15")), "SW004");
    expectCode(await createBooking(a, resources, at(1, "13:00")), "SW004");
    const afterTimeOff = await createBooking(a, resources, at(1, "14:00"));
    expect(afterTimeOff.error).toBeNull();

    await a.client
      .from("customers")
      .update({ is_active: false })
      .eq("id", resources.customerId);
    expectCode(await createBooking(a, resources, at(1, "10:00")), "SW006");
    await a.client
      .from("customers")
      .update({ is_active: true })
      .eq("id", resources.customerId);

    await a.client
      .from("services")
      .update({ is_active: false })
      .eq("id", resources.serviceId);
    expectCode(await createBooking(a, resources, at(1, "10:15")), "SW006");
    await a.client
      .from("services")
      .update({ is_active: true })
      .eq("id", resources.serviceId);

    await a.client
      .from("staff")
      .update({ is_active: false })
      .eq("id", resources.staffId);
    expectCode(await createBooking(a, resources, at(1, "10:30")), "SW006");
    await a.client
      .from("staff")
      .update({ is_active: true })
      .eq("id", resources.staffId);

    expectCode(await createBooking(a, otherTenantResources, at(1, "11:00")), "SW006");

    const { count: afterCount } = await a.client
      .from("appointments")
      .select("id", { count: "exact", head: true });
    const { count: afterEvents } = await a.client
      .from("appointment_events")
      .select("id", { count: "exact", head: true });
    expect(afterCount).toBe((beforeCount ?? 0) + 1);
    expect(afterEvents).toBe((beforeEvents ?? 0) + 1);
  });

  it("resolves concurrent bookings without double-booking", async () => {
    const a = tenantA();
    const resources = await setupResources(a);
    const start = at(1, "15:00");

    const [first, second] = await Promise.all([
      createBooking(a, resources, start),
      createBooking(a, resources, start),
    ]);
    const results = [first, second];
    const successes = results.filter((result) => !result.error);
    const conflicts = results.filter((result) => result.error);
    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(1);
    expectCode(conflicts[0]!, "SW001");

    const { data: rows } = await a.client
      .from("appointments")
      .select("id")
      .eq("staff_id", resources.staffId)
      .eq("start_at", start.toISOString());
    expect(rows).toHaveLength(1);
  });
});

describe("rescheduling", () => {
  it("moves bookings, revalidates conflicts, updates snapshots, and writes history", async () => {
    const a = tenantA();
    const b = tenantB();
    const resources = await setupResources(a);
    const replacement = await setupResources(a, {
      duration: 60,
      price: 120,
    });
    const first = await createBooking(a, resources, at(1, "09:00"));
    const blocker = await createBooking(a, resources, at(1, "11:00"));
    expect(first.error).toBeNull();
    expect(blocker.error).toBeNull();

    expectCode(
      await rescheduleBooking(a, first.appointment!.id, resources, at(1, "11:00")),
      "SW001",
    );
    const { data: unchanged } = await a.client
      .from("appointments")
      .select("start_at")
      .eq("id", first.appointment!.id)
      .single();
    expect(new Date(unchanged!.start_at).getTime()).toBe(at(1, "09:00").getTime());

    const moved = await rescheduleBooking(
      a,
      first.appointment!.id,
      resources,
      at(1, "10:00"),
      "Moved",
    );
    expect(moved.error).toBeNull();
    expect(moved.appointment).toMatchObject({ notes: "Moved" });
    expect(new Date(moved.appointment!.start_at).getTime()).toBe(at(1, "10:00").getTime());
    expect(new Date(moved.appointment!.end_at).getTime()).toBe(
      at(1, "10:00").getTime() + 45 * 60_000,
    );

    const { data: rescheduleEvent } = await a.client
      .from("appointment_events")
      .select("event_type, summary")
      .eq("appointment_id", first.appointment!.id)
      .eq("event_type", "rescheduled")
      .single();
    expect(rescheduleEvent?.summary).toContain("Rescheduled from");

    await a.client
      .from("customers")
      .update({ is_active: false })
      .eq("id", resources.customerId);
    const inactiveCustomerMove = await rescheduleBooking(
      a,
      first.appointment!.id,
      resources,
      at(1, "12:00"),
    );
    expect(inactiveCustomerMove.error).toBeNull();

    const rebuilt = await rescheduleBooking(
      a,
      first.appointment!.id,
      replacement,
      at(1, "14:00"),
    );
    expect(rebuilt.error).toBeNull();
    expect(rebuilt.appointment).toMatchObject({
      staff_id: replacement.staffId,
      service_id: replacement.serviceId,
      service_name_snapshot: replacement.serviceName,
      duration_minutes_snapshot: 60,
    });
    expect(Number(rebuilt.appointment!.price_amount_snapshot)).toBe(120);

    await transition(a, first.appointment!.id, "cancelled");
    expectCode(
      await rescheduleBooking(a, first.appointment!.id, resources, at(1, "16:00")),
      "SW005",
    );

    const other = await setupResources(b);
    const otherBooking = await createBooking(b, other, at(1, "09:00"));
    expect(otherBooking.error).toBeNull();
    expectCode(
      await rescheduleBooking(a, otherBooking.appointment!.id, resources, at(1, "16:00")),
      "SW006",
    );
  });
});

describe("status workflow", () => {
  it("enforces the documented transition matrix", async () => {
    const a = tenantA();
    const resources = await setupResources(a);
    const { appointment } = await createBooking(a, resources, at(1, "10:00"));
    const id = appointment!.id;

    expectCode(await transition(a, id, "archived"), "SW005");
    expectCode(await transition(a, id, "in_progress"), "SW005");
    expectCode(await transition(a, id, "completed"), "SW005");

    const confirmed = await transition(a, id, "confirmed");
    expect(confirmed.error).toBeNull();
    expect(confirmed.appointment?.status).toBe("confirmed");
    expectCode(await transition(a, id, "confirmed"), "SW005");
    expectCode(await transition(a, id, "completed"), "SW005");
    expectCode(await transition(a, id, "in_progress"), "SW007");
    expectCode(await transition(a, id, "no_show"), "SW007");

    const cancelled = await transition(a, id, "cancelled");
    expect(cancelled.error).toBeNull();
    expectCode(await transition(a, id, "confirmed"), "SW005");

    const { data: events } = await a.client
      .from("appointment_events")
      .select("event_type, from_status, to_status")
      .eq("appointment_id", id)
      .order("created_at");
    expect(events).toEqual([
      { event_type: "created", from_status: null, to_status: "pending" },
      { event_type: "status_changed", from_status: "pending", to_status: "confirmed" },
      { event_type: "status_changed", from_status: "confirmed", to_status: "cancelled" },
    ]);
  });

  it("enforces start and no-show timing windows", async () => {
    const a = tenantA();
    const resources = await setupResources(a);
    const future = await createBooking(a, resources, at(1, "11:00"));
    await transition(a, future.appointment!.id, "confirmed");
    expectCode(await transition(a, future.appointment!.id, "in_progress"), "SW007");

    const nearStart = new Date(Date.now() - 5 * 60_000);
    await admin
      .from("appointments")
      .update({
        start_at: nearStart.toISOString(),
        end_at: new Date(nearStart.getTime() + 30 * 60_000).toISOString(),
      })
      .eq("id", future.appointment!.id);

    const started = await transition(a, future.appointment!.id, "in_progress");
    expect(started.error).toBeNull();
    expect(started.appointment?.status).toBe("in_progress");
    const completed = await transition(a, future.appointment!.id, "completed");
    expect(completed.error).toBeNull();
    expectCode(await transition(a, future.appointment!.id, "cancelled"), "SW005");

    const secondResources = await setupResources(a);
    const noShow = await createBooking(a, secondResources, at(1, "13:00"));
    await transition(a, noShow.appointment!.id, "confirmed");
    expectCode(await transition(a, noShow.appointment!.id, "no_show"), "SW007");

    const pastStart = new Date(Date.now() - 10 * 60_000);
    await admin
      .from("appointments")
      .update({
        start_at: pastStart.toISOString(),
        end_at: new Date(pastStart.getTime() + 30 * 60_000).toISOString(),
      })
      .eq("id", noShow.appointment!.id);

    const marked = await transition(a, noShow.appointment!.id, "no_show");
    expect(marked.error).toBeNull();
    expect(marked.appointment?.status).toBe("no_show");
  });
});

describe("time off and working hours", () => {
  it("rejects overlapping time off while allowing adjacency", async () => {
    const a = tenantA();
    const resources = await setupResources(a);
    const firstStart = at(2, "13:00");

    const insert = (start: Date, end: Date) =>
      a.client.from("staff_time_off").insert({
        user_id: a.userId,
        staff_id: resources.staffId,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
      });

    expect((await insert(firstStart, new Date(firstStart.getTime() + 3_600_000))).error).toBeNull();
    const overlap = await insert(
      new Date(firstStart.getTime() + 1_800_000),
      new Date(firstStart.getTime() + 5_400_000),
    );
    expectCode({ error: overlap.error }, "23P01");
    const adjacent = await insert(
      new Date(firstStart.getTime() + 3_600_000),
      new Date(firstStart.getTime() + 7_200_000),
    );
    expect(adjacent.error).toBeNull();

    const { data: rows } = await a.client
      .from("staff_time_off")
      .select("id")
      .eq("staff_id", resources.staffId);
    expect(rows).toHaveLength(2);
  });

  it("replaces schedules atomically and refuses cross-tenant access", async () => {
    const a = tenantA();
    const b = tenantB();
    const resources = await setupResources(a);
    const countHours = async (staffId: string) => {
      const { count } = await a.client
        .from("staff_working_hours")
        .select("id", { count: "exact", head: true })
        .eq("staff_id", staffId);
      return count ?? 0;
    };
    expect(await countHours(resources.staffId)).toBe(7);

    const invalid = await a.client.rpc("replace_staff_working_hours", {
      p_staff_id: resources.staffId,
      p_days: [{ weekday: 2, start_time: "17:00", end_time: "09:00" }],
    });
    expectCode({ error: invalid.error }, "22023");
    expect(await countHours(resources.staffId)).toBe(7);

    const valid = await a.client.rpc("replace_staff_working_hours", {
      p_staff_id: resources.staffId,
      p_days: [
        { weekday: 2, start_time: "09:00", end_time: "17:00" },
        { weekday: 4, start_time: "10:00", end_time: "15:00" },
      ],
    });
    expect(valid.error).toBeNull();
    expect(await countHours(resources.staffId)).toBe(2);

    const duplicate = await a.client.rpc("replace_staff_working_hours", {
      p_staff_id: resources.staffId,
      p_days: [
        { weekday: 2, start_time: "09:00", end_time: "17:00" },
        { weekday: 2, start_time: "10:00", end_time: "12:00" },
      ],
    });
    expectCode({ error: duplicate.error }, "22023");
    expect(await countHours(resources.staffId)).toBe(2);

    const crossTenant = await b.client.rpc("replace_staff_working_hours", {
      p_staff_id: resources.staffId,
      p_days: [],
    });
    expectCode({ error: crossTenant.error }, "SW006");
    expect(await countHours(resources.staffId)).toBe(2);
  });
});
