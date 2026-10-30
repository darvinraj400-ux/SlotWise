import "server-only";

import { ACTIVE_STATUSES } from "@/lib/appointments/status";
import type { TypedSupabaseClient } from "@/lib/supabase/server";
import type { Appointment, Staff, StaffTimeOff, StaffWorkingHours } from "@/lib/types";
import {
  dataError,
  DEFAULT_PAGE_SIZE,
  likePattern,
  pageCountFor,
} from "./helpers";

export type StaffStatusFilter = "active" | "archived" | "all";

export async function getStaffList(
  supabase: TypedSupabaseClient,
  userId: string,
  params: { search?: string; status?: StaffStatusFilter; page?: number },
) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("staff")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("full_name", { ascending: true })
    .range(from, from + pageSize - 1);

  if (params.search?.trim()) {
    query = query.ilike("full_name", likePattern(params.search));
  }
  if (params.status === "active") query = query.eq("is_active", true);
  if (params.status === "archived") query = query.eq("is_active", false);

  const { data, error, count } = await query;
  if (error) dataError("staff.list", error);

  return {
    staff: (data ?? []) as Staff[],
    total: count ?? 0,
    page,
    pageSize,
    pageCount: pageCountFor(count ?? 0, pageSize),
  };
}

export async function getStaffById(
  supabase: TypedSupabaseClient,
  userId: string,
  staffId: string,
): Promise<Staff | null> {
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("user_id", userId)
    .eq("id", staffId)
    .maybeSingle();

  if (error) dataError("staff.get", error);
  return data;
}

export async function getStaffOptions(
  supabase: TypedSupabaseClient,
  userId: string,
  activeOnly = true,
) {
  let query = supabase
    .from("staff")
    .select("id, full_name, is_active")
    .eq("user_id", userId)
    .order("full_name", { ascending: true });

  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) dataError("staff.options", error);
  return data ?? [];
}

export async function countActiveStaff(
  supabase: TypedSupabaseClient,
  userId: string,
) {
  const { count, error } = await supabase
    .from("staff")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) dataError("staff.count", error);
  return count ?? 0;
}

export async function getStaffSchedule(
  supabase: TypedSupabaseClient,
  userId: string,
  staffId: string,
): Promise<StaffWorkingHours[]> {
  const { data, error } = await supabase
    .from("staff_working_hours")
    .select("*")
    .eq("user_id", userId)
    .eq("staff_id", staffId)
    .order("weekday", { ascending: true });

  if (error) dataError("staff.schedule", error);
  return data ?? [];
}

export async function getStaffTimeOff(
  supabase: TypedSupabaseClient,
  userId: string,
  staffId: string,
): Promise<StaffTimeOff[]> {
  const { data, error } = await supabase
    .from("staff_time_off")
    .select("*")
    .eq("user_id", userId)
    .eq("staff_id", staffId)
    .order("starts_at", { ascending: false })
    .limit(50);

  if (error) dataError("staff.timeOff", error);
  return data ?? [];
}

export type StaffUpcomingAppointment = Pick<
  Appointment,
  "id" | "start_at" | "end_at" | "status" | "service_name_snapshot"
> & {
  customers: { id: string; full_name: string } | null;
};

export async function getStaffUpcomingAppointments(
  supabase: TypedSupabaseClient,
  userId: string,
  staffId: string,
  now = new Date(),
): Promise<StaffUpcomingAppointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("id, start_at, end_at, status, service_name_snapshot, customers(id, full_name)")
    .eq("user_id", userId)
    .eq("staff_id", staffId)
    .gte("start_at", now.toISOString())
    .in("status", ACTIVE_STATUSES)
    .order("start_at", { ascending: true })
    .limit(10);

  if (error) dataError("staff.upcoming", error);
  return (data ?? []) as StaffUpcomingAppointment[];
}
