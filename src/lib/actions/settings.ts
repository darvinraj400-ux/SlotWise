"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/context";
import { fieldErrorsFromZod, mapDatabaseError } from "@/lib/errors";
import { settingsSchema } from "@/lib/validation/schemas";
import { formString } from "@/lib/validation/form";
import type { FormState } from "./types";

export async function updateSettingsAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireSession();

  const parsed = settingsSchema.safeParse({
    businessName: formString(formData, "businessName"),
    timezone: formString(formData, "timezone"),
    currencyCode: formString(formData, "currencyCode"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const { data, error } = await supabase
    .from("business_settings")
    .update({
      business_name: parsed.data.businessName,
      timezone: parsed.data.timezone,
      currency_code: parsed.data.currencyCode,
    })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();

  if (error) {
    console.error("[settings.update]", { code: error.code });
    return { status: "error", message: mapDatabaseError(error) };
  }

  if (!data) {
    return {
      status: "error",
      message: "Your business settings were not found. Refresh and try again.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Settings saved." };
}
