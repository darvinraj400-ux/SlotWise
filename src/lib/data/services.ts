import "server-only";

import type { TypedSupabaseClient } from "@/lib/supabase/server";
import type { Service } from "@/lib/types";
import {
  dataError,
  DEFAULT_PAGE_SIZE,
  likePattern,
  pageCountFor,
} from "./helpers";

export type ServiceStatusFilter = "active" | "archived" | "all";

export async function getServiceList(
  supabase: TypedSupabaseClient,
  userId: string,
  params: { search?: string; status?: ServiceStatusFilter; page?: number },
) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("services")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("name", { ascending: true })
    .range(from, from + pageSize - 1);

  if (params.search?.trim()) {
    query = query.ilike("name", likePattern(params.search));
  }
  if (params.status === "active") query = query.eq("is_active", true);
  if (params.status === "archived") query = query.eq("is_active", false);

  const { data, error, count } = await query;
  if (error) dataError("services.list", error);

  return {
    services: (data ?? []) as Service[],
    total: count ?? 0,
    page,
    pageSize,
    pageCount: pageCountFor(count ?? 0, pageSize),
  };
}

export async function getServiceById(
  supabase: TypedSupabaseClient,
  userId: string,
  serviceId: string,
): Promise<Service | null> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("user_id", userId)
    .eq("id", serviceId)
    .maybeSingle();

  if (error) dataError("services.get", error);
  return data;
}

export async function getServiceOptions(
  supabase: TypedSupabaseClient,
  userId: string,
  activeOnly = true,
) {
  let query = supabase
    .from("services")
    .select("id, name, duration_minutes, price_amount, is_active")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) dataError("services.options", error);
  return data ?? [];
}

export async function countActiveServices(
  supabase: TypedSupabaseClient,
  userId: string,
) {
  const { count, error } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) dataError("services.count", error);
  return count ?? 0;
}
