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
  customerSchema,
  uuidSchema,
  type CustomerInput,
} from "@/lib/validation/schemas";
import { databaseFailure, nullableText } from "./helpers";

function refreshCustomerViews(customerId?: string) {
  revalidatePath("/customers");
  revalidatePath("/appointments");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  if (customerId) revalidatePath(`/customers/${customerId}`);
}

export async function createCustomerAction(
  input: CustomerInput,
): Promise<ActionResult<{ id: string }>> {
  const { supabase, user } = await requireSession();

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure(
      "Check the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      user_id: user.id,
      full_name: parsed.data.fullName,
      email: nullableText(parsed.data.email),
      phone: nullableText(parsed.data.phone),
      notes: nullableText(parsed.data.notes),
    })
    .select("id")
    .single();

  if (error) return databaseFailure("customers.create", error);

  refreshCustomerViews(data.id);
  return actionSuccess({ id: data.id });
}

export async function updateCustomerAction(
  customerId: string,
  input: CustomerInput,
): Promise<ActionResult> {
  const { supabase, user } = await requireSession();

  const id = uuidSchema.safeParse(customerId);
  if (!id.success) return actionFailure("That customer was not found.");

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure(
      "Check the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  const { data, error } = await supabase
    .from("customers")
    .update({
      full_name: parsed.data.fullName,
      email: nullableText(parsed.data.email),
      phone: nullableText(parsed.data.phone),
      notes: nullableText(parsed.data.notes),
    })
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return databaseFailure("customers.update", error);
  if (!data) return actionFailure("That customer was not found.");

  refreshCustomerViews(id.data);
  return actionSuccess(undefined);
}

export async function setCustomerActiveAction(
  customerId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const { supabase, user } = await requireSession();

  const id = uuidSchema.safeParse(customerId);
  if (!id.success) return actionFailure("That customer was not found.");

  const { data, error } = await supabase
    .from("customers")
    .update({ is_active: isActive })
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return databaseFailure("customers.setActive", error);
  if (!data) return actionFailure("That customer was not found.");

  refreshCustomerViews(id.data);
  return actionSuccess(undefined);
}
