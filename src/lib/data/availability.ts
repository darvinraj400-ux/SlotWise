import "server-only";

import {
  getAvailableSlots,
  type AvailableSlot,
} from "@/lib/appointments/availability";
import {
  dayBounds,
  getIsoWeekday,
  timeStringToMinutes,
} from "@/lib/time";
import type { TypedSupabaseClient } from "@/lib/supabase/server";
import { getActiveAppointmentBusyRanges } from "./appointments";
import { dataError } from "./helpers";

export type AvailabilityResult = {
  slots: AvailableSlot[];
  reason: string | null;
  timeZone: string;
  staffName: string | null;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    priceAmount: number;
  } | null;
};

export async function getAvailabilityForBooking(
  supabase: TypedSupabaseClient,
  userId: string,
  params: {
    staffId: string;
    serviceId: string;
    dateKey: string;
    timeZone: string;
    excludeAppointmentId?: string;
    now?: Date;
  },
): Promise<AvailabilityResult> {
  const empty = (reason: string): AvailabilityResult => ({
    slots: [],
    reason,
    timeZone: params.timeZone,
    staffName: null,
    service: null,
  });

  const [staffResult, serviceResult] = await Promise.all([
    supabase
      .from("staff")
      .select("id, full_name, is_active")
      .eq("id", params.staffId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("services")
      .select("id, name, duration_minutes, price_amount, is_active")
      .eq("id", params.serviceId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (staffResult.error) dataError("availability.staff", staffResult.error);
  if (serviceResult.error) dataError("availability.service", serviceResult.error);

  const staff = staffResult.data;
  const service = serviceResult.data;

  if (!staff || !staff.is_active) return empty("Choose an active staff member.");
  if (!service || !service.is_active) return empty("Choose an active service.");

  const weekday = getIsoWeekday(params.dateKey, params.timeZone);

  const { data: hours, error: hoursError } = await supabase
    .from("staff_working_hours")
    .select("start_time, end_time")
    .eq("user_id", userId)
    .eq("staff_id", params.staffId)
    .eq("weekday", weekday)
    .maybeSingle();

  if (hoursError) dataError("availability.hours", hoursError);

  if (!hours) {
    return {
      ...empty("This staff member is not scheduled to work on this day."),
      staffName: staff.full_name,
      service: {
        id: service.id,
        name: service.name,
        durationMinutes: service.duration_minutes,
        priceAmount: Number(service.price_amount),
      },
    };
  }

  const { start: dayStart, end: dayEnd } = dayBounds(params.dateKey, params.timeZone);

  const [busy, timeOffResult] = await Promise.all([
    getActiveAppointmentBusyRanges(
      supabase,
      userId,
      params.staffId,
      dayStart,
      dayEnd,
      params.excludeAppointmentId,
    ),
    supabase
      .from("staff_time_off")
      .select("starts_at, ends_at")
      .eq("user_id", userId)
      .eq("staff_id", params.staffId)
      .lt("starts_at", dayEnd.toISOString())
      .gt("ends_at", dayStart.toISOString()),
  ]);

  if (timeOffResult.error) dataError("availability.timeOff", timeOffResult.error);

  const slots = getAvailableSlots({
    dateKey: params.dateKey,
    timeZone: params.timeZone,
    workingStart: hours.start_time,
    workingEnd: hours.end_time,
    durationMinutes: service.duration_minutes,
    busy: [
      ...busy.map((range) => ({
        startAt: range.start_at,
        endAt: range.end_at,
      })),
      ...(timeOffResult.data ?? []).map((range) => ({
        startAt: range.starts_at,
        endAt: range.ends_at,
      })),
    ],
    now: params.now,
  });

  const workStart = timeStringToMinutes(hours.start_time);
  const workEnd = timeStringToMinutes(hours.end_time);
  const windowTooShort =
    workStart !== null &&
    workEnd !== null &&
    workEnd - workStart < service.duration_minutes;

  return {
    slots,
    reason:
      slots.length > 0
        ? null
        : windowTooShort
          ? "This service is longer than the staff member's working window on this day."
          : "No open times on this day. Try another date or staff member.",
    timeZone: params.timeZone,
    staffName: staff.full_name,
    service: {
      id: service.id,
      name: service.name,
      durationMinutes: service.duration_minutes,
      priceAmount: Number(service.price_amount),
    },
  };
}
