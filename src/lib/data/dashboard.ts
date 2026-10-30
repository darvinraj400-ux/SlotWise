import "server-only";

import { ACTIVE_STATUSES } from "@/lib/appointments/status";
import {
  dayBounds,
  reportingRange,
  todayDateKey,
  type RangePreset,
} from "@/lib/time";
import type { TypedSupabaseClient } from "@/lib/supabase/server";
import type { Customer } from "@/lib/types";
import {
  getAppointmentsInRange,
  getUpcomingAppointments,
  type AppointmentWithDetails,
  type UpcomingAppointment,
} from "./appointments";
import { dataError } from "./helpers";

export type RecentCustomer = Pick<
  Customer,
  "id" | "full_name" | "email" | "created_at" | "is_active"
>;

export type DashboardData = {
  preset: RangePreset;
  rangeLabel: string;
  fromKey: string;
  toKey: string;
  appointments: AppointmentWithDetails[];
  todayAppointments: AppointmentWithDetails[];
  upcoming: UpcomingAppointment[];
  upcomingCount: number;
  recentCustomers: RecentCustomer[];
  counts: { customers: number; services: number; staff: number };
};

const VALID_PRESETS: RangePreset[] = ["7d", "30d", "90d", "month"];

export function parseRangePreset(value: string | undefined): RangePreset {
  return VALID_PRESETS.includes(value as RangePreset)
    ? (value as RangePreset)
    : "30d";
}

export async function getDashboardData(
  supabase: TypedSupabaseClient,
  userId: string,
  timeZone: string,
  preset: RangePreset,
  now = new Date(),
): Promise<DashboardData> {
  const range = reportingRange(preset, timeZone, now);
  const todayKey = todayDateKey(timeZone, now);
  const today = dayBounds(todayKey, timeZone);
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    appointmentRange,
    todayRange,
    upcoming,
    upcomingCountResult,
    recentResult,
    customerCountResult,
    serviceCountResult,
    staffCountResult,
  ] = await Promise.all([
      getAppointmentsInRange(
        supabase,
        userId,
        new Date(range.start),
        new Date(range.endExclusive),
      ),
      getAppointmentsInRange(
        supabase,
        userId,
        new Date(today.start),
        new Date(today.end),
      ),
      getUpcomingAppointments(supabase, userId, now, 6),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("start_at", now.toISOString())
        .lt("start_at", weekAhead.toISOString())
        .in("status", ACTIVE_STATUSES),
      supabase
        .from("customers")
        .select("id, full_name, email, created_at, is_active")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("staff")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

  if (upcomingCountResult.error) dataError("dashboard.upcomingCount", upcomingCountResult.error);
  if (recentResult.error) dataError("dashboard.recentCustomers", recentResult.error);
  if (customerCountResult.error) dataError("dashboard.customerCount", customerCountResult.error);
  if (serviceCountResult.error) dataError("dashboard.serviceCount", serviceCountResult.error);
  if (staffCountResult.error) dataError("dashboard.staffCount", staffCountResult.error);

  return {
    preset,
    rangeLabel: range.label,
    fromKey: range.fromKey,
    toKey: range.toKey,
    appointments: appointmentRange.appointments,
    todayAppointments: todayRange.appointments,
    upcoming,
    upcomingCount: upcomingCountResult.count ?? 0,
    recentCustomers: (recentResult.data ?? []) as RecentCustomer[],
    counts: {
      customers: customerCountResult.count ?? 0,
      services: serviceCountResult.count ?? 0,
      staff: staffCountResult.count ?? 0,
    },
  };
}
