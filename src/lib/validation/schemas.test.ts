import { describe, expect, it } from "vitest";
import {
  bookingSchema,
  customerSchema,
  loginSchema,
  serviceSchema,
  settingsSchema,
  signupSchema,
  statusTransitionSchema,
  timeOffSchema,
  workingHoursSchema,
} from "@/lib/validation/schemas";

const uuid = "0cf5193c-4f03-479f-abd3-baca211a81dd";

describe("customerSchema", () => {
  it("trims names and accepts optional contact fields", () => {
    const parsed = customerSchema.safeParse({
      fullName: "  Amara Silva  ",
      email: "",
      phone: "",
      notes: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.fullName).toBe("Amara Silva");
      expect(parsed.data.email).toBe("");
    }
  });

  it("rejects blank names and malformed emails", () => {
    const blank = customerSchema.safeParse({ fullName: "   " });
    expect(blank.success).toBe(false);
    const badEmail = customerSchema.safeParse({
      fullName: "Amara",
      email: "not-an-email",
    });
    expect(badEmail.success).toBe(false);
    if (!badEmail.success) {
      expect(badEmail.error.issues[0]?.path).toEqual(["email"]);
    }
  });

  it("enforces length limits", () => {
    expect(
      customerSchema.safeParse({ fullName: "a".repeat(121) }).success,
    ).toBe(false);
    expect(
      customerSchema.safeParse({ fullName: "Amara", phone: "1".repeat(41) }).success,
    ).toBe(false);
    expect(
      customerSchema.safeParse({ fullName: "Amara", notes: "n".repeat(4001) }).success,
    ).toBe(false);
  });
});

describe("serviceSchema", () => {
  const valid = { name: "Signature cut", durationMinutes: "45", priceAmount: "75.50" };

  it("coerces numeric strings from forms", () => {
    const parsed = serviceSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.durationMinutes).toBe(45);
      expect(parsed.data.priceAmount).toBe(75.5);
    }
  });

  it("rejects invalid durations", () => {
    for (const durationMinutes of ["0", "4", "12.5", "721", "", "abc"]) {
      expect(serviceSchema.safeParse({ ...valid, durationMinutes }).success).toBe(false);
    }
  });

  it("rejects negative or over-precise prices", () => {
    for (const priceAmount of ["-1", "12.345", "1000000.01", ""]) {
      expect(serviceSchema.safeParse({ ...valid, priceAmount }).success).toBe(false);
    }
    expect(serviceSchema.safeParse({ ...valid, priceAmount: "0" }).success).toBe(true);
  });
});

describe("settingsSchema", () => {
  it("accepts a valid IANA zone and normalises currency casing", () => {
    const parsed = settingsSchema.safeParse({
      businessName: "Northside Barbers",
      timezone: "Asia/Kuala_Lumpur",
      currencyCode: "myr",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.currencyCode).toBe("MYR");
  });

  it("rejects unknown zones and malformed currencies", () => {
    expect(
      settingsSchema.safeParse({
        businessName: "Northside",
        timezone: "Mars/Olympus",
        currencyCode: "MYR",
      }).success,
    ).toBe(false);
    for (const currencyCode of ["US", "MYRR", "12A"]) {
      expect(
        settingsSchema.safeParse({
          businessName: "Northside",
          timezone: "Asia/Kuala_Lumpur",
          currencyCode,
        }).success,
      ).toBe(false);
    }
  });
});

describe("workingHoursSchema", () => {
  it("accepts a valid weekday and coerces weekday strings", () => {
    const parsed = workingHoursSchema.safeParse({
      weekday: "3",
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.weekday).toBe(3);
  });

  it("rejects equal or reversed intervals", () => {
    expect(
      workingHoursSchema.safeParse({
        weekday: 1,
        startTime: "09:00",
        endTime: "09:00",
      }).success,
    ).toBe(false);
    expect(
      workingHoursSchema.safeParse({
        weekday: 1,
        startTime: "17:00",
        endTime: "09:00",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid weekdays and malformed times", () => {
    expect(
      workingHoursSchema.safeParse({
        weekday: 0,
        startTime: "09:00",
        endTime: "17:00",
      }).success,
    ).toBe(false);
    expect(
      workingHoursSchema.safeParse({
        weekday: 8,
        startTime: "09:00",
        endTime: "17:00",
      }).success,
    ).toBe(false);
    expect(
      workingHoursSchema.safeParse({
        weekday: 1,
        startTime: "9:00",
        endTime: "17:00",
      }).success,
    ).toBe(false);
  });
});

describe("timeOffSchema", () => {
  it("accepts real calendar dates", () => {
    expect(
      timeOffSchema.safeParse({
        startDate: "2026-10-30",
        startTime: "09:00",
        endDate: "2026-10-30",
        endTime: "12:00",
        reason: "Dentist",
      }).success,
    ).toBe(true);
  });

  it("rejects impossible dates", () => {
    expect(
      timeOffSchema.safeParse({
        startDate: "2026-02-30",
        startTime: "09:00",
        endDate: "2026-03-02",
        endTime: "12:00",
      }).success,
    ).toBe(false);
  });
});

describe("booking and status schemas", () => {
  const valid = {
    customerId: uuid,
    staffId: uuid,
    serviceId: uuid,
    date: "2026-10-28",
    startAt: "2026-10-28T02:00:00.000Z",
  };

  it("accepts a well-formed booking payload", () => {
    expect(bookingSchema.safeParse(valid).success).toBe(true);
    expect(bookingSchema.safeParse({ ...valid, notes: "First visit" }).success).toBe(true);
  });

  it("rejects malformed ids, dates, and instants", () => {
    expect(bookingSchema.safeParse({ ...valid, customerId: "not-a-uuid" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, date: "2026-02-30" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, startAt: "tomorrow" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, notes: "n".repeat(4001) }).success).toBe(false);
  });

  it("restricts status transitions to known statuses", () => {
    expect(
      statusTransitionSchema.safeParse({ appointmentId: uuid, status: "completed" }).success,
    ).toBe(true);
    expect(
      statusTransitionSchema.safeParse({ appointmentId: uuid, status: "archived" }).success,
    ).toBe(false);
  });
});

describe("auth schemas", () => {
  it("validates login fields", () => {
    expect(loginSchema.safeParse({ email: "a@example.com", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@example.com", password: "" }).success).toBe(false);
  });

  it("requires a letter and number in signup passwords", () => {
    const base = {
      businessName: "Northside Barbers",
      email: "a@example.com",
      password: "abcdefgh1",
      confirmPassword: "abcdefgh1",
    };
    expect(signupSchema.safeParse(base).success).toBe(true);
    expect(signupSchema.safeParse({ ...base, password: "abcdefgh", confirmPassword: "abcdefgh" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, password: "12345678", confirmPassword: "12345678" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, password: "short1", confirmPassword: "short1" }).success).toBe(false);
  });

  it("flags mismatched confirmation passwords", () => {
    const parsed = signupSchema.safeParse({
      businessName: "Northside",
      email: "a@example.com",
      password: "abcdefgh1",
      confirmPassword: "abcdefgh2",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path[0] === "confirmPassword")).toBe(true);
    }
  });
});
