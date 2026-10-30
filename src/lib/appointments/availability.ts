import {
  formatDateKey,
  formatTime,
  localDateTimeToInstant,
  minutesToTimeInput,
  timeStringToMinutes,
} from "@/lib/time";
import { minuteOfDayInZone, SLOT_STEP_MINUTES } from "./booking";

export type BusyInterval = { startAt: string; endAt: string };

export type AvailableSlot = {
  startAt: string;
  endAt: string;
  startTime: string;
  label: string;
  endLabel: string;
};

export type AvailabilityInput = {
  dateKey: string;
  timeZone: string;
  workingStart: string;
  workingEnd: string;
  durationMinutes: number;
  busy: BusyInterval[];
  now?: Date;
  stepMinutes?: number;
};

export function getAvailableSlots(input: AvailabilityInput): AvailableSlot[] {
  const workStart = timeStringToMinutes(input.workingStart);
  const workEnd = timeStringToMinutes(input.workingEnd);
  const step = input.stepMinutes ?? SLOT_STEP_MINUTES;
  const now = input.now ?? new Date();

  if (
    workStart === null ||
    workEnd === null ||
    workEnd <= workStart ||
    input.durationMinutes <= 0 ||
    step <= 0
  ) {
    return [];
  }

  const latestStart = workEnd - input.durationMinutes;
  if (latestStart < workStart) return [];

  const busy = input.busy
    .map((interval) => ({
      start: new Date(interval.startAt).getTime(),
      end: new Date(interval.endAt).getTime(),
    }))
    .filter((interval) => Number.isFinite(interval.start) && Number.isFinite(interval.end));

  const slots: AvailableSlot[] = [];
  const seen = new Set<string>();

  for (let minute = workStart; minute <= latestStart; minute += step) {
    const localTime = minutesToTimeInput(minute);
    const start = localDateTimeToInstant(input.dateKey, localTime, input.timeZone);
    if (!start) continue;
    if (start.getTime() <= now.getTime()) continue;

    const end = new Date(start.getTime() + input.durationMinutes * 60_000);

    if (formatDateKey(end, input.timeZone) !== input.dateKey) continue;

    const endMinuteOfDay = minuteOfDayInZone(end, input.timeZone);
    if (endMinuteOfDay > workEnd) continue;

    const startMs = start.getTime();
    const endMs = end.getTime();
    const overlaps = busy.some(
      (interval) => startMs < interval.end && interval.start < endMs,
    );
    if (overlaps) continue;

    const iso = start.toISOString();
    if (seen.has(iso)) continue;
    seen.add(iso);

    slots.push({
      startAt: iso,
      endAt: end.toISOString(),
      startTime: localTime,
      label: formatTime(start, input.timeZone),
      endLabel: formatTime(end, input.timeZone),
    });
  }

  return slots;
}
