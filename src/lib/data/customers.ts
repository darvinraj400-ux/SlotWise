import "server-only";

import type { TypedSupabaseClient } from "@/lib/supabase/server";
import type { Appointment, Customer } from "@/lib/types";
import {
  dataError,
  DEFAULT_PAGE_SIZE,
  likePattern,
  pageCountFor,
} from "./helpers";

export type CustomerStatusFilter = "active" | "archived" | "all";

export type CustomerListParams = {
  search?: string;
  status?: CustomerStatusFilter;
  page?: number;
};

export async function getCustomerList(
  supabase: TypedSupabaseClient,
  userId: string,
  params: CustomerListParams,
) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("customers")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("full_name", { ascending: true })
    .range(from, to);

  if (params.search?.trim()) {
    query = query.ilike("full_name", likePattern(params.search));
  }
  if (params.status === "active") query = query.eq("is_active", true);
  if (params.status === "archived") query = query.eq("is_active", false);

  const { data, error, count } = await query;
  if (error) dataError("customers.list", error);

  return {
    customers: (data ?? []) as Customer[],
    total: count ?? 0,
    page,
    pageSize,
    pageCount: pageCountFor(count ?? 0, pageSize),
  };
}

export async function getCustomerById(
  supabase: TypedSupabaseClient,
  userId: string,
  customerId: string,
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", userId)
    .eq("id", customerId)
    .maybeSingle();

  if (error) dataError("customers.get", error);
  return data;
}

export type CustomerAppointmentRow = Pick<
  Appointment,
  | "id"
  | "start_at"
  | "end_at"
  | "status"
  | "service_name_snapshot"
  | "duration_minutes_snapshot"
  | "price_amount_snapshot"
> & {
  staff: { full_name: string } | null;
};

export async function getCustomerAppointments(
  supabase: TypedSupabaseClient,
  userId: string,
  customerId: string,
): Promise<CustomerAppointmentRow[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, start_at, end_at, status, service_name_snapshot, duration_minutes_snapshot, price_amount_snapshot, staff(full_name)",
    )
    .eq("user_id", userId)
    .eq("customer_id", customerId)
    .order("start_at", { ascending: false })
    .limit(100);

  if (error) dataError("customers.appointments", error);
  return (data ?? []) as CustomerAppointmentRow[];
}

export async function getCustomerOptions(
  supabase: TypedSupabaseClient,
  userId: string,
  activeOnly = true,
) {
  let query = supabase
    .from("customers")
    .select("id, full_name, email, phone")
    .eq("user_id", userId)
    .order("full_name", { ascending: true });

  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) dataError("customers.options", error);
  return data ?? [];
}

export async function getCustomerStats(
  supabase: TypedSupabaseClient,
  userId: string,
  customerId: string,
  now = new Date(),
) {
  const rows: { status: string; price_amount_snapshot: number; start_at: string }[] = [];
  let page = 0;
  const batchSize = 1000;

  while (page < 20) {
    const { data, error } = await supabase
      .from("appointments")
      .select("status, price_amount_snapshot, start_at")
      .eq("user_id", userId)
      .eq("customer_id", customerId)
      .order("start_at", { ascending: false })
      .range(page * batchSize, page * batchSize + batchSize - 1);

    if (error) dataError("customers.stats", error);
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < batchSize) break;
    page += 1;
  }

  const completed = rows.filter((row) => row.status === "completed");
  const revenue = completed.reduce(
    (sum, row) => sum + Number(row.price_amount_snapshot),
    0,
  );
  const upcoming = rows.filter(
    (row) =>
      new Date(row.start_at).getTime() >= now.getTime() &&
      ["pending", "confirmed", "in_progress"].includes(row.status),
  ).length;

  return {
    total: rows.length,
    completed: completed.length,
    cancelled: rows.filter((row) => row.status === "cancelled").length,
    noShow: rows.filter((row) => row.status === "no_show").length,
    upcoming,
    revenue: Math.round(revenue * 100) / 100,
  };
}
