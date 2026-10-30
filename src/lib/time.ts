import { TZDate } from "@date-fns/tz";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getISODay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export const DEFAULT_TIME_ZONE = "Asia/Kuala_Lumpur";
export const DEFAULT_CURRENCY = "MYR";

export const WEEKDAY_LABELS = [
  { weekday: 1, label: "Monday", short: "Mon" },
  { weekday: 2, label: "Tuesday", short: "Tue" },
  { weekday: 3, label: "Wednesday", short: "Wed" },
  { weekday: 4, label: "Thursday", short: "Thu" },
  { weekday: 5, label: "Friday", short: "Fri" },
  { weekday: 6, label: "Saturday", short: "Sat" },
  { weekday: 7, label: "Sunday", short: "Sun" },
] as const;

export const CURRENCIES = [
  { code: "MYR", label: "Malaysian ringgit" },
  { code: "SGD", label: "Singapore dollar" },
  { code: "USD", label: "US dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British pound" },
  { code: "AUD", label: "Australian dollar" },
  { code: "CAD", label: "Canadian dollar" },
  { code: "NZD", label: "New Zealand dollar" },
  { code: "JPY", label: "Japanese yen" },
  { code: "CNY", label: "Chinese yuan" },
  { code: "HKD", label: "Hong Kong dollar" },
  { code: "THB", label: "Thai baht" },
  { code: "IDR", label: "Indonesian rupiah" },
  { code: "PHP", label: "Philippine peso" },
  { code: "INR", label: "Indian rupee" },
  { code: "AED", label: "UAE dirham" },
] as const;

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_INPUT_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DB_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?(?:\.\d+)?$/;

export type DateKeyParts = { year: number; month: number; day: number };

export function isValidTimeZone(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function getSupportedTimeZones(current?: string): string[] {
  const intlWithValues = Intl as unknown as {
    supportedValuesOf?: (key: string) => string[];
  };
  let zones: string[] = [];
  try {
    zones = intlWithValues.supportedValuesOf?.("timeZone") ?? [];
  } catch {
    zones = [];
  }
  if (zones.length === 0) {
    zones = [
      "UTC",
      "Asia/Kuala_Lumpur",
      "Asia/Singapore",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Kolkata",
      "Asia/Dubai",
      "Europe/London",
      "Europe/Paris",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Australia/Sydney",
      "Pacific/Auckland",
    ];
  }
  const set = new Set(zones);
  if (current && !set.has(current)) set.add(current);
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function parseDateKey(value: string | null | undefined): DateKeyParts | null {
  if (!value) return null;
  const match = DATE_KEY_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function zonedNoon(dateKey: string, timeZone: string): TZDate {
  const parts = parseDateKey(dateKey);
  if (!parts) throw new Error(`Invalid date: ${dateKey}`);
  return new TZDate(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0, timeZone);
}

export function formatZoned(
  value: Date | string | number | null | undefined,
  timeZone: string,
  pattern: string,
  fallback = "—",
): string {
  if (value === null || value === undefined) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return format(new TZDate(date, timeZone), pattern);
}

export function formatDateKey(
  value: Date | string | number,
  timeZone: string,
): string {
  return formatZoned(value, timeZone, "yyyy-MM-dd", "");
}

export function todayDateKey(timeZone: string, now = new Date()): string {
  return formatDateKey(now, timeZone);
}

export function formatShortDate(value: Date | string, timeZone: string) {
  return formatZoned(value, timeZone, "MMM d");
}

export function formatDateLong(value: Date | string, timeZone: string) {
  return formatZoned(value, timeZone, "EEEE, MMMM d, yyyy");
}

export function formatDateMedium(value: Date | string, timeZone: string) {
  return formatZoned(value, timeZone, "MMM d, yyyy");
}

export function formatTime(value: Date | string, timeZone: string) {
  return formatZoned(value, timeZone, "h:mm a");
}

export function formatDateTime(value: Date | string, timeZone: string) {
  return formatZoned(value, timeZone, "EEE, MMM d · h:mm a");
}

export function formatDateTimeFull(value: Date | string, timeZone: string) {
  return formatZoned(value, timeZone, "EEE, MMM d, yyyy · h:mm a");
}

export function toDateInputValue(value: Date | string, timeZone: string) {
  return formatZoned(value, timeZone, "yyyy-MM-dd", "");
}

export function toTimeInputValue(value: Date | string, timeZone: string) {
  return formatZoned(value, timeZone, "HH:mm", "");
}

export function dayBounds(dateKey: string, timeZone: string) {
  const noon = zonedNoon(dateKey, timeZone);
  const start = startOfDay(noon);
  const end = startOfDay(addDays(noon, 1));
  return { start, end };
}

export function addDaysToKey(dateKey: string, days: number, timeZone: string) {
  return formatDateKey(addDays(zonedNoon(dateKey, timeZone), days), timeZone);
}

export function addMonthsToKey(dateKey: string, months: number, timeZone: string) {
  return formatDateKey(addMonths(zonedNoon(dateKey, timeZone), months), timeZone);
}

export function startOfWeekKey(dateKey: string, timeZone: string) {
  return formatDateKey(
    startOfWeek(zonedNoon(dateKey, timeZone), { weekStartsOn: 1 }),
    timeZone,
  );
}

export function getWeekKeys(dateKey: string, timeZone: string): string[] {
  const weekStart = startOfWeek(zonedNoon(dateKey, timeZone), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) =>
    formatDateKey(addDays(weekStart, index), timeZone),
  );
}

export function getMonthGrid(dateKey: string, timeZone: string) {
  const noon = zonedNoon(dateKey, timeZone);
  const monthStart = startOfMonth(noon);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(noon), { weekStartsOn: 1 });
  const naturalDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const keys = naturalDays.map((day) => formatDateKey(day, timeZone));
  while (keys.length < 42) {
    keys.push(addDaysToKey(keys[keys.length - 1]!, 1, timeZone));
  }
  const monthPrefix = formatZoned(noon, timeZone, "yyyy-MM", "");
  return keys.slice(0, 42).map((key) => ({
    dateKey: key,
    inMonth: key.startsWith(monthPrefix),
  }));
}

export function getIsoWeekday(dateKey: string, timeZone: string): number {
  return getISODay(zonedNoon(dateKey, timeZone));
}

export function timeStringToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = DB_TIME_PATTERN.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function timeInputToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = TIME_INPUT_PATTERN.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToTimeInput(minutes: number): string {
  const safe = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function formatTimeOfDay(value: string | null | undefined): string {
  const minutes = timeStringToMinutes(value);
  if (minutes === null) return "—";
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour24 < 12 ? "AM" : "PM";
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function localDateTimeToInstant(
  dateKey: string,
  time: string,
  timeZone: string,
): Date | null {
  const parts = parseDateKey(dateKey);
  const minuteMatch = TIME_INPUT_PATTERN.exec(time);
  if (!parts || !minuteMatch) return null;

  const hours = Number(minuteMatch[1]);
  const minutes = Number(minuteMatch[2]);
  const candidate = new TZDate(
    parts.year,
    parts.month - 1,
    parts.day,
    hours,
    minutes,
    0,
    0,
    timeZone,
  );

  // Reject wall-clock times that do not exist, e.g. 02:30 during spring-forward.
  if (
    candidate.getFullYear() !== parts.year ||
    candidate.getMonth() !== parts.month - 1 ||
    candidate.getDate() !== parts.day ||
    candidate.getHours() !== hours ||
    candidate.getMinutes() !== minutes
  ) {
    return null;
  }

  return new Date(candidate.getTime());
}

export function formatDateRange(from: Date | string, to: Date | string, timeZone: string) {
  const sameYear =
    formatZoned(from, timeZone, "yyyy", "") === formatZoned(to, timeZone, "yyyy", "");
  return sameYear
    ? formatZoned(from, timeZone, "MMM d", "") +
        " – " +
        formatZoned(to, timeZone, "MMM d, yyyy", "")
    : formatZoned(from, timeZone, "MMM d, yyyy", "") +
        " – " +
        formatZoned(to, timeZone, "MMM d, yyyy", "");
}

export type RangePreset = "7d" | "30d" | "90d" | "month";

export function reportingRange(
  preset: RangePreset,
  timeZone: string,
  now = new Date(),
) {
  const todayKey = todayDateKey(timeZone, now);
  let fromKey: string;

  if (preset === "month") {
    fromKey = formatZoned(
      startOfMonth(zonedNoon(todayKey, timeZone)),
      timeZone,
      "yyyy-MM-dd",
      "",
    );
  } else {
    const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
    fromKey = addDaysToKey(todayKey, -(days - 1), timeZone);
  }

  const { start } = dayBounds(fromKey, timeZone);
  const { start: todayStart, end: endExclusive } = dayBounds(todayKey, timeZone);

  return {
    fromKey,
    toKey: todayKey,
    start,
    endExclusive,
    label: formatDateRange(start, todayStart, timeZone),
  };
}

export function isValidCurrencyCode(value: string): boolean {
  if (!/^[A-Z]{3}$/.test(value)) return false;
  try {
    new Intl.NumberFormat("en-US", { style: "currency", currency: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function formatMoney(
  amount: number | string | null | undefined,
  currencyCode: string,
): string {
  const numeric = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  if (!Number.isFinite(numeric)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "narrowSymbol",
    }).format(numeric);
  } catch {
    return `${currencyCode} ${numeric.toFixed(2)}`;
  }
}

export function formatCompactMoney(
  amount: number,
  currencyCode: string,
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "narrowSymbol",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return formatMoney(amount, currencyCode);
  }
}
