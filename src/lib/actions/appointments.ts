"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/context";
import {
  actionFailure,
  actionSuccess,
  fieldErrorsFromZod,
  logActionError,
  type ActionResult,
} from "@/lib/errors";
import { getAvailabilityForBooking, type AvailabilityResult } from "@/lib/data/availability";
import { formatDateKey, parseDateKey } from "@/lib/time";
import {
  bookingSchema,
  rescheduleSchema,
  statusTransitionSchema,
  uuidSchema,
  type BookingInput,
  type RescheduleInput,
} from "@/lib/validation/schemas";
import { databaseFailure } from "./helpers";

function refreshAppointmentViews(input: {
  appointmentId?: string;
  customerId?: string;
  staffId?: string;
}) {
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/appointments");
  revalidatePath("/reports");
  revalidatePath("/staff");
  if (input.appointmentId) revalidatePath(`/appointments/${input.appointmentId}`);
  if (input.customerId) revalidatePath(`/customers/${input.customerId}`);
  if (input.staffId) revalidatePath(`/staff/${input.staffId}`);
}

export type AvailabilityActionParams = {
  staffId: string;
  serviceId: string;
  dateKey: string;
  appointmentId?: string;
};

export async function getAvailabilityAction(
  params: AvailabilityActionParams,
): Promise<ActionResult<AvailabilityResult>> {
  const { supabase, user, settings } = await requireSession();

  const staffId = uuidSchema.safeParse(params.staffId);
  const serviceId = uuidSchema.safeParse(params.serviceId);

  if (!staffId.success) return actionFailure("Choose a staff member.");
  if (!serviceId.success) return actionFailure("Choose a service.");
  if (!parseDateKey(params.dateKey)) return actionFailure("Choose a valid date.");

  let appointmentId: string | undefined;

  if (params.appointmentId) {
    const parsedAppointmentId = uuidSchema.safeParse(params.appointmentId);
    if (!parsedAppointmentId.success) {
      return actionFailure("That appointment was not found.");
    }

    const { data, error } = await supabase
      .from("appointments")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", parsedAppointmentId.data)
      .maybeSingle();

    if (error) return databaseFailure("appointments.availability.appointment", error);
    if (!data) return actionFailure("That appointment was not found.");
    appointmentId = data.id;
  }

  try {
    const availability = await getAvailabilityForBooking(supabase, user.id, {
      staffId: staffId.data,
      serviceId: serviceId.data,
      dateKey: params.dateKey,
      timeZone: settings.timezone,
      excludeAppointmentId: appointmentId,
    });
    return actionSuccess(availability);
  } catch (error) {
    logActionError("appointments.availability", error);
    return actionFailure("Availability couldn't be loaded. Please try again.");
  }
}

export async function createAppointmentAction(
  input: BookingInput,
): Promise<ActionResult<{ id: string; customerId: string }>> {
  const { supabase, settings } = await requireSession();

  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure(
      "Check the booking details.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  if (formatDateKey(parsed.data.startAt, settings.timezone) !== parsed.data.date) {
    return actionFailure("The selected date and time no longer match.", {
      startAt: ["Choose a time slot again."],
    });
  }

  const { data, error } = await supabase.rpc("create_appointment", {
    p_customer_id: parsed.data.customerId,
    p_staff_id: parsed.data.staffId,
    p_service_id: parsed.data.serviceId,
    p_start_at: parsed.data.startAt,
    p_notes: parsed.data.notes?.trim() ?? "",
  });

  if (error) return databaseFailure("appointments.create", error);

  refreshAppointmentViews({
    appointmentId: data.id,
    customerId: data.customer_id,
    staffId: data.staff_id,
  });

  return actionSuccess({ id: data.id, customerId: data.customer_id });
}

export async function rescheduleAppointmentAction(
  input: RescheduleInput,
): Promise<ActionResult<{ id: string }>> {
  const { supabase, settings } = await requireSession();

  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure(
      "Check the appointment details.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  if (formatDateKey(parsed.data.startAt, settings.timezone) !== parsed.data.date) {
    return actionFailure("The selected date and time no longer match.", {
      startAt: ["Choose a time slot again."],
    });
  }

  const { data, error } = await supabase.rpc("reschedule_appointment", {
    p_appointment_id: parsed.data.appointmentId,
    p_staff_id: parsed.data.staffId,
    p_service_id: parsed.data.serviceId,
    p_start_at: parsed.data.startAt,
    p_notes: parsed.data.notes?.trim() ?? "",
  });

  if (error) return databaseFailure("appointments.reschedule", error);

  refreshAppointmentViews({
    appointmentId: data.id,
    customerId: data.customer_id,
    staffId: data.staff_id,
  });

  return actionSuccess({ id: data.id });
}

export async function transitionAppointmentStatusAction(
  appointmentId: string,
  status: string,
): Promise<ActionResult<{ status: string }>> {
  const { supabase } = await requireSession();

  const parsed = statusTransitionSchema.safeParse({ appointmentId, status });
  if (!parsed.success) {
    return actionFailure("That status change is not valid.");
  }

  const { data, error } = await supabase.rpc("transition_appointment_status", {
    p_appointment_id: parsed.data.appointmentId,
    p_new_status: parsed.data.status,
  });

  if (error) return databaseFailure("appointments.transition", error);

  refreshAppointmentViews({
    appointmentId: data.id,
    customerId: data.customer_id,
    staffId: data.staff_id,
  });

  return actionSuccess({ status: data.status });
}
