"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/context";
import {
  actionFailure,
  actionSuccess,
  fieldErrorsFromZod,
  type ActionResult,
} from "@/lib/errors";
import {
  serviceSchema,
  uuidSchema,
  type ServiceInput,
} from "@/lib/validation/schemas";
import { databaseFailure, nullableText } from "./helpers";

function refreshServiceViews() {
  revalidatePath("/services");
  revalidatePath("/appointments");
  revalidatePath("/appointments/new");
  revalidatePath("/calendar");
  revalidatePath("/reports");
}

export async function createServiceAction(
  input: ServiceInput,
): Promise<ActionResult<{ id: string }>> {
  const { supabase, user } = await requireSession();

  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure(
      "Check the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  const { data, error } = await supabase
    .from("services")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      description: nullableText(parsed.data.description),
      duration_minutes: parsed.data.durationMinutes,
      price_amount: parsed.data.priceAmount,
    })
    .select("id")
    .single();

  if (error) return databaseFailure("services.create", error);

  refreshServiceViews();
  return actionSuccess({ id: data.id });
}

export async function updateServiceAction(
  serviceId: string,
  input: ServiceInput,
): Promise<ActionResult> {
  const { supabase, user } = await requireSession();

  const id = uuidSchema.safeParse(serviceId);
  if (!id.success) return actionFailure("That service was not found.");

  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure(
      "Check the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  const { data, error } = await supabase
    .from("services")
    .update({
      name: parsed.data.name,
      description: nullableText(parsed.data.description),
      duration_minutes: parsed.data.durationMinutes,
      price_amount: parsed.data.priceAmount,
    })
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return databaseFailure("services.update", error);
  if (!data) return actionFailure("That service was not found.");

  refreshServiceViews();
  return actionSuccess(undefined);
}

export async function setServiceActiveAction(
  serviceId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const { supabase, user } = await requireSession();

  const id = uuidSchema.safeParse(serviceId);
  if (!id.success) return actionFailure("That service was not found.");

  const { data, error } = await supabase
    .from("services")
    .update({ is_active: isActive })
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return databaseFailure("services.setActive", error);
  if (!data) return actionFailure("That service was not found.");

  refreshServiceViews();
  return actionSuccess(undefined);
}
