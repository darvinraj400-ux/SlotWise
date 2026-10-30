import { z } from "zod";
import {
  isValidCurrencyCode,
  isValidTimeZone,
  parseDateKey,
  timeInputToMinutes,
} from "@/lib/time";

const optionalEmail = z
  .string()
  .trim()
  .max(320, "Email must be 320 characters or fewer.")
  .refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Enter a valid email address.",
  )
  .optional();

const optionalPhone = z
  .string()
  .trim()
  .max(40, "Phone must be 40 characters or fewer.")
  .optional();

const toNumber = (value: unknown) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : Number(trimmed);
  }
  return value;
};

const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name.")
  .max(120, "Name must be 120 characters or fewer.");

export const customerSchema = z.object({
  fullName: nameSchema,
  email: optionalEmail,
  phone: optionalPhone,
  notes: z.string().trim().max(4000, "Notes must be 4000 characters or fewer.").optional(),
});
export type CustomerInput = z.infer<typeof customerSchema>;

export const staffSchema = customerSchema;
export type StaffInput = z.infer<typeof staffSchema>;

export const serviceSchema = z.object({
  name: nameSchema,
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer.")
    .optional(),
  durationMinutes: z.preprocess(
    toNumber,
    z
      .number({ error: "Enter a valid duration." })
      .int("Duration must be a whole number of minutes.")
      .min(5, "Duration must be at least 5 minutes.")
      .max(720, "Duration must be 12 hours or less."),
  ),
  priceAmount: z.preprocess(
    toNumber,
    z
      .number({ error: "Enter a valid price." })
      .min(0, "Price cannot be negative.")
      .max(1_000_000, "Price is too large.")
      .refine(
        (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
        "Price can have at most two decimal places.",
      ),
  ),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

export const settingsSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(1, "Enter your business name.")
    .max(120, "Business name must be 120 characters or fewer."),
  timezone: z
    .string()
    .trim()
    .min(1, "Choose a time zone.")
    .refine(isValidTimeZone, "Choose a valid IANA time zone."),
  currencyCode: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine(isValidCurrencyCode, "Choose a valid three-letter currency code."),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

const timeInputSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a valid time (HH:mm).");

export const workingHoursSchema = z
  .object({
    weekday: z.coerce
      .number({ error: "Choose a weekday." })
      .int()
      .min(1)
      .max(7),
    startTime: timeInputSchema,
    endTime: timeInputSchema,
  })
  .superRefine((value, ctx) => {
    const start = timeInputToMinutes(value.startTime);
    const end = timeInputToMinutes(value.endTime);
    if (start === null || end === null) return;
    if (end <= start) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after start time.",
      });
    }
  });
export type WorkingHoursInput = z.infer<typeof workingHoursSchema>;

export const timeOffSchema = z
  .object({
    startDate: z
      .string()
      .refine((value) => parseDateKey(value) !== null, "Choose a valid start date."),
    startTime: timeInputSchema,
    endDate: z
      .string()
      .refine((value) => parseDateKey(value) !== null, "Choose a valid end date."),
    endTime: timeInputSchema,
    reason: z.string().trim().max(500, "Reason must be 500 characters or fewer.").optional(),
  });
export type TimeOffInput = z.infer<typeof timeOffSchema>;

const isoInstant = z
  .string()
  .min(1, "Choose a time slot.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Choose a valid time slot.");

export const bookingSchema = z.object({
  customerId: z.uuid("Choose a customer."),
  staffId: z.uuid("Choose a staff member."),
  serviceId: z.uuid("Choose a service."),
  date: z
    .string()
    .refine((value) => parseDateKey(value) !== null, "Choose a valid date."),
  startAt: isoInstant,
  notes: z.string().trim().max(4000, "Notes must be 4000 characters or fewer.").optional(),
});
export type BookingInput = z.infer<typeof bookingSchema>;

export const rescheduleSchema = z.object({
  appointmentId: z.uuid(),
  staffId: z.uuid("Choose a staff member."),
  serviceId: z.uuid("Choose a service."),
  date: z
    .string()
    .refine((value) => parseDateKey(value) !== null, "Choose a valid date."),
  startAt: isoInstant,
  notes: z.string().trim().max(4000, "Notes must be 4000 characters or fewer.").optional(),
});
export type RescheduleInput = z.infer<typeof rescheduleSchema>;

export const statusTransitionSchema = z.object({
  appointmentId: z.uuid(),
  status: z.enum([
    "pending",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
  ]),
});

const authEmail = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(320, "Email must be 320 characters or fewer.")
  .email("Enter a valid email address.");

const authPassword = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.")
  .regex(/[A-Za-z]/, "Password must include a letter.")
  .regex(/\d/, "Password must include a number.");

export const loginSchema = z.object({
  email: authEmail,
  password: z.string().min(1, "Enter your password."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(1, "Enter your business name.")
      .max(120, "Business name must be 120 characters or fewer."),
    email: authEmail,
    password: authPassword,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });
export type SignupInput = z.infer<typeof signupSchema>;

export const uuidSchema = z.uuid();
