"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/context";
import {
  actionFailure,
  actionSuccess,
  fieldErrorsFromZod,
  type ActionResult,
} from "@/lib/errors";
import type { Json } from "@/lib/supabase/database.types";
import { localDateTimeToInstant } from "@/lib/time";
import {
  staffSchema,
  timeOffSchema,
  uuidSchema,
  workingHoursSchema,
  type StaffInput,
  type TimeOffInput,
} from "@/lib/validation/schemas";
import { databaseFailure, nullableText } from "./helpers";

function refreshStaffViews(staffId?: string) {
  revalidatePath("/staff");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/appointments");
  revalidatePath("/appointments/new");
  if (staffId) revalidatePath(`/staff/${staffId}`);
}

export async function createStaffAction(
  input: StaffInput,
): Promise<ActionResult<{ id: string }>> {
  const { supabase, user } = await requireSession();

  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure(
      "Check the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  const { data, error } = await supabase
    .from("staff")
    .insert({
      user_id: user.id,
      full_name: parsed.data.fullName,
      email: nullableText(parsed.data.email),
      phone: nullableText(parsed.data.phone),
      notes: nullableText(parsed.data.notes),
    })
    .select("id")
    .single();

  if (error) return databaseFailure("staff.create", error);

  refreshStaffViews(data.id);
  return actionSuccess({ id: data.id });
}

export async function updateStaffAction(
  staffId: string,
  input: StaffInput,
): Promise<ActionResult> {
  const { supabase, user } = await requireSession();

  const id = uuidSchema.safeParse(staffId);
  if (!id.success) return actionFailure("That staff member was not found.");

  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure(
      "Check the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  const { data, error } = await supabase
    .from("staff")
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

  if (error) return databaseFailure("staff.update", error);
  if (!data) return actionFailure("That staff member was not found.");

  refreshStaffViews(id.data);
  return actionSuccess(undefined);
}

export async function setStaffActiveAction(
  staffId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const { supabase, user } = await requireSession();

  const id = uuidSchema.safeParse(staffId);
  if (!id.success) return actionFailure("That staff member was not found.");

  const { data, error } = await supabase
    .from("staff")
    .update({ is_active: isActive })
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return databaseFailure("staff.setActive", error);
  if (!data) return actionFailure("That staff member was not found.");

  refreshStaffViews(id.data);
  return actionSuccess(undefined);
}

export type ScheduleDayInput = {
  weekday: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
};

export async function saveStaffScheduleAction(
  staffId: string,
  days: ScheduleDayInput[],
): Promise<ActionResult> {
  const { supabase, user } = await requireSession();

  const id = uuidSchema.safeParse(staffId);
  if (!id.success) return actionFailure("That staff member was not found.");

  if (!Array.isArray(days) || days.length > 7) {
    return actionFailure("A weekly schedule can contain at most seven days.");
  }

  const enabledDays: ScheduleDayInput[] = [];
  const seen = new Set<number>();

  for (const day of days) {
    if (!day?.enabled) continue;
    if (seen.has(day.weekday)) {
      return actionFailure("Each weekday can only appear once.");
    }
    const parsed = workingHoursSchema.safeParse(day);
    if (!parsed.success) {
      return actionFailure(
        "Check the schedule times.",
        fieldErrorsFromZod(parsed.error),
      );
    }
    seen.add(day.weekday);
    enabledDays.push(day);
  }

  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("id")
    .eq("id", id.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (staffError) return databaseFailure("staff.schedule.staff", staffError);
  if (!staff) return actionFailure("That staff member was not found.");

  const payload = enabledDays.map((day) => ({
    weekday: day.weekday,
    start_time: day.startTime,
    end_time: day.endTime,
  }));

  const { error } = await supabase.rpc("replace_staff_working_hours", {
    p_staff_id: id.data,
    p_days: payload as unknown as Json,
  });

  if (error) return databaseFailure("staff.schedule.save", error);

  refreshStaffViews(id.data);
  return actionSuccess(undefined);
}

export async function createTimeOffAction(
  staffId: string,
  input: TimeOffInput,
): Promise<ActionResult<{ id: string }>> {
  const { supabase, user, settings } = await requireSession();

  const id = uuidSchema.safeParse(staffId);
  if (!id.success) return actionFailure("That staff member was not found.");

  const parsed = timeOffSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure(
      "Check the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  const startsAt = localDateTimeToInstant(
    parsed.data.startDate,
    parsed.data.startTime,
    settings.timezone,
  );
  const endsAt = localDateTimeToInstant(
    parsed.data.endDate,
    parsed.data.endTime,
    settings.timezone,
  );

  const fieldErrors: Record<string, string[]> = {};
  if (!startsAt) {
    fieldErrors.startTime = [
      "That start time does not exist in your business time zone (daylight-saving change).",
    ];
  }
  if (!endsAt) {
    fieldErrors.endTime = [
      "That end time does not exist in your business time zone (daylight-saving change).",
    ];
  }
  if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime()) {
    fieldErrors.endTime = ["End time must be after the start time."];
  }
  if (Object.keys(fieldErrors).length > 0) {
    return actionFailure("Check the time-off dates and times.", fieldErrors);
  }

  const { data, error } = await supabase
    .from("staff_time_off")
    .insert({
      user_id: user.id,
      staff_id: id.data,
      starts_at: startsAt!.toISOString(),
      ends_at: endsAt!.toISOString(),
      reason: nullableText(parsed.data.reason),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23P01") {
      return actionFailure(
        "This time off overlaps another time-off entry for this staff member.",
      );
    }
    return databaseFailure("staff.timeOff.create", error);
  }

  refreshStaffViews(id.data);
  return actionSuccess({ id: data.id });
}

export async function deleteTimeOffAction(
  timeOffId: string,
  staffId: string,
): Promise<ActionResult> {
  const { supabase, user } = await requireSession();

  const timeOff = uuidSchema.safeParse(timeOffId);
  const staff = uuidSchema.safeParse(staffId);
  if (!timeOff.success || !staff.success) {
    return actionFailure("That time-off entry was not found.");
  }

  const { data, error } = await supabase
    .from("staff_time_off")
    .delete()
    .eq("id", timeOff.data)
    .eq("staff_id", staff.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return databaseFailure("staff.timeOff.delete", error);
  if (!data) return actionFailure("That time-off entry was not found.");

  refreshStaffViews(staff.data);
  return actionSuccess(undefined);
}
