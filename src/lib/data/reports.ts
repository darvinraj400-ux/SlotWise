import "server-only";

import {
  dayBounds,
  formatDateRange,
  parseDateKey,
  todayDateKey,
} from "@/lib/time";
import type { TypedSupabaseClient } from "@/lib/supabase/server";
import {
  getAppointmentsInRange,
  type AppointmentRangeResult,
} from "./appointments";

export const REPORT_APPOINTMENT_LIMIT = 20_000;

export type ReportRange = {
  fromKey: string;
  toKey: string;
  start: Date;
  endExclusive: Date;
  label: string;
};

export function resolveReportRange(
  fromParam: string | undefined,
  toParam: string | undefined,
  timeZone: string,
  now = new Date(),
): ReportRange {
  const todayKey = todayDateKey(timeZone, now);

  let toKey = parseDateKey(toParam) ? toParam! : todayKey;
  let fromKey: string;

  if (parseDateKey(fromParam)) {
    fromKey = fromParam!;
  } else {
    fromKey = `${toKey.slice(0, 8)}01`;
  }

  if (fromKey > toKey) {
    [fromKey, toKey] = [toKey, fromKey];
  }

  const { start } = dayBounds(fromKey, timeZone);
  const { end: endExclusive, start: toDayStart } = dayBounds(toKey, timeZone);

  return {
    fromKey,
    toKey,
    start,
    endExclusive,
    label: formatDateRange(start, toDayStart, timeZone),
  };
}

export async function getReportAppointments(
  supabase: TypedSupabaseClient,
  userId: string,
  range: ReportRange,
): Promise<AppointmentRangeResult> {
  return getAppointmentsInRange(
    supabase,
    userId,
    range.start,
    range.endExclusive,
    { maxRows: REPORT_APPOINTMENT_LIMIT },
  );
}
