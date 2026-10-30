import { formatDateKey, formatZoned, formatTime, timeStringToMinutes } from "@/lib/time";

export const SLOT_STEP_MINUTES = 15;

export function computeEndAt(
  startAt: Date | string,
  durationMinutes: number,
): Date {
  const start = startAt instanceof Date ? startAt : new Date(startAt);
  return new Date(start.getTime() + durationMinutes * 60_000);
}

export function minuteOfDayInZone(
  value: Date | string,
  timeZone: string,
): number {
  const formatted = formatZoned(value, timeZone, "HH:mm", "00:00");
  const [hours, minutes] = formatted.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function isWithinWorkingHours(input: {
  startAt: Date | string;
  endAt: Date | string;
  dateKey: string;
  timeZone: string;
  workingStart: string;
  workingEnd: string;
}): boolean {
  const workStart = timeStringToMinutes(input.workingStart);
  const workEnd = timeStringToMinutes(input.workingEnd);
  if (workStart === null || workEnd === null || workEnd <= workStart) return false;

  const startDate = formatDateKey(new Date(input.startAt), input.timeZone);
  const endDate = formatDateKey(new Date(input.endAt), input.timeZone);
  if (startDate !== input.dateKey || endDate !== input.dateKey) return false;

  const startMinute = minuteOfDayInZone(input.startAt, input.timeZone);
  const endMinute = minuteOfDayInZone(input.endAt, input.timeZone);

  return startMinute >= workStart && endMinute <= workEnd && endMinute > startMinute;
}

export function rangesOverlap(
  aStart: Date | string,
  aEnd: Date | string,
  bStart: Date | string,
  bEnd: Date | string,
): boolean {
  const a1 = new Date(aStart).getTime();
  const a2 = new Date(aEnd).getTime();
  const b1 = new Date(bStart).getTime();
  const b2 = new Date(bEnd).getTime();
  return a1 < b2 && b1 < a2;
}

export function isSlotBlocked(
  startAt: Date,
  endAt: Date,
  busy: { startAt: string; endAt: string }[],
): boolean {
  return busy.some((interval) =>
    rangesOverlap(startAt, endAt, interval.startAt, interval.endAt),
  );
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours} hr`;
  return `${hours} hr ${remainder} min`;
}

export function formatSlotRange(
  startAt: Date | string,
  endAt: Date | string,
  timeZone: string,
) {
  return `${formatTime(startAt, timeZone)} – ${formatTime(endAt, timeZone)}`;
}
