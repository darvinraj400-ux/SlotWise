import "server-only";

import { ACTIVE_STATUSES, type AppointmentStatus } from "@/lib/appointments/status";
import type { TypedSupabaseClient } from "@/lib/supabase/server";
import type {
  Appointment,
  AppointmentEvent,
  Customer,
  Service,
  Staff,
} from "@/lib/types";
import {
  dataError,
  DEFAULT_PAGE_SIZE,
  likePattern,
  pageCountFor,
} from "./helpers";

export type AppointmentWithDetails = Appointment & {
  customers: Customer | null;
  staff: Staff | null;
  services: Service | null;
};

export type AppointmentListParams = {
  search?: string;
  status?: AppointmentStatus;
  staffId?: string;
  serviceId?: string;
  from?: Date;
  to?: Date;
  page?: number;
};

const APPOINTMENT_RELATIONS = "*, customers(*), staff(*), services(*)";

export async function getAppointmentList(
  supabase: TypedSupabaseClient,
  userId: string,
  params: AppointmentListParams,
) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;

  let customerIds: string[] | null = null;
  if (params.search?.trim()) {
    const { data: matches, error: matchError } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .ilike("full_name", likePattern(params.search))
      .limit(200);

    if (matchError) dataError("appointments.searchCustomers", matchError);
    customerIds = (matches ?? []).map((match) => match.id);
    if (customerIds.length === 0) {
      return {
        appointments: [] as AppointmentWithDetails[],
        total: 0,
        page,
        pageSize,
        pageCount: 1,
      };
    }
  }

  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_RELATIONS, { count: "exact" })
    .eq("user_id", userId)
    .order("start_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (customerIds) query = query.in("customer_id", customerIds);
  if (params.status) query = query.eq("status", params.status);
  if (params.staffId) query = query.eq("staff_id", params.staffId);
  if (params.serviceId) query = query.eq("service_id", params.serviceId);
  if (params.from) query = query.gte("start_at", params.from.toISOString());
  if (params.to) query = query.lt("start_at", params.to.toISOString());

  const { data, error, count } = await query;
  if (error) dataError("appointments.list", error);

  return {
    appointments: (data ?? []) as AppointmentWithDetails[],
    total: count ?? 0,
    page,
    pageSize,
    pageCount: pageCountFor(count ?? 0, pageSize),
  };
}

export async function getAppointmentById(
  supabase: TypedSupabaseClient,
  userId: string,
  appointmentId: string,
): Promise<AppointmentWithDetails | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_RELATIONS)
    .eq("user_id", userId)
    .eq("id", appointmentId)
    .maybeSingle();

  if (error) dataError("appointments.get", error);
  return data as AppointmentWithDetails | null;
}

export async function getAppointmentEvents(
  supabase: TypedSupabaseClient,
  userId: string,
  appointmentId: string,
): Promise<AppointmentEvent[]> {
  const { data, error } = await supabase
    .from("appointment_events")
    .select("*")
    .eq("user_id", userId)
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: true });

  if (error) dataError("appointments.events", error);
  return data ?? [];
}

const RANGE_BATCH_SIZE = 1000;

export type AppointmentRangeResult = {
  appointments: AppointmentWithDetails[];
  exceeded: boolean;
  limit: number | null;
};

export type AppointmentRangeOptions = {
  staffId?: string;
  maxRows?: number;
};

export async function getAppointmentsInRange(
  supabase: TypedSupabaseClient,
  userId: string,
  start: Date,
  end: Date,
  options: AppointmentRangeOptions = {},
): Promise<AppointmentRangeResult> {
  const { staffId, maxRows } = options;

  if (maxRows !== undefined && (!Number.isInteger(maxRows) || maxRows < 1)) {
    throw new Error("maxRows must be a positive integer.");
  }

  const rows: AppointmentWithDetails[] = [];

  while (true) {
    const remaining = maxRows === undefined ? RANGE_BATCH_SIZE : maxRows - rows.length;
    const pageSize =
      maxRows === undefined
        ? RANGE_BATCH_SIZE
        : Math.min(RANGE_BATCH_SIZE, remaining + 1);

    let query = supabase
      .from("appointments")
      .select(APPOINTMENT_RELATIONS)
      .eq("user_id", userId)
      .gte("start_at", start.toISOString())
      .lt("start_at", end.toISOString())
      .order("start_at", { ascending: true })
      .order("id", { ascending: true });

    if (staffId) query = query.eq("staff_id", staffId);

    const { data, error } = await query.range(
      rows.length,
      rows.length + pageSize - 1,
    );
    if (error) dataError("appointments.range", error);

    const batch = (data ?? []) as AppointmentWithDetails[];

    if (maxRows !== undefined && rows.length + batch.length > maxRows) {
      return { appointments: rows, exceeded: true, limit: maxRows };
    }

    rows.push(...batch);
    if (batch.length < pageSize) {
      return { appointments: rows, exceeded: false, limit: maxRows ?? null };
    }
  }
}

export type UpcomingAppointment = Pick<
  Appointment,
  "id" | "start_at" | "end_at" | "status" | "service_name_snapshot"
> & {
  customers: { id: string; full_name: string } | null;
  staff: { id: string; full_name: string } | null;
};

export async function getUpcomingAppointments(
  supabase: TypedSupabaseClient,
  userId: string,
  now: Date,
  limit = 6,
): Promise<UpcomingAppointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, start_at, end_at, status, service_name_snapshot, customers(id, full_name), staff(id, full_name)",
    )
    .eq("user_id", userId)
    .gte("start_at", now.toISOString())
    .in("status", ACTIVE_STATUSES)
    .order("start_at", { ascending: true })
    .limit(limit);

  if (error) dataError("appointments.upcoming", error);
  return (data ?? []) as UpcomingAppointment[];
}

export async function getActiveAppointmentBusyRanges(
  supabase: TypedSupabaseClient,
  userId: string,
  staffId: string,
  dayStart: Date,
  dayEnd: Date,
  excludeAppointmentId?: string,
) {
  let query = supabase
    .from("appointments")
    .select("start_at, end_at")
    .eq("user_id", userId)
    .eq("staff_id", staffId)
    .in("status", ACTIVE_STATUSES)
    .lt("start_at", dayEnd.toISOString())
    .gt("end_at", dayStart.toISOString());

  if (excludeAppointmentId) query = query.neq("id", excludeAppointmentId);

  const { data, error } = await query;
  if (error) dataError("appointments.busy", error);
  return (data ?? []) as { start_at: string; end_at: string }[];
}
