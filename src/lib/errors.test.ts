import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fieldErrorsFromZod, mapDatabaseError } from "@/lib/errors";

describe("mapDatabaseError", () => {
  it("maps booking conflicts and adjacency-safe slot errors", () => {
    expect(mapDatabaseError({ code: "SW001" })).toContain("no longer available");
    expect(mapDatabaseError({ code: "23P01" })).toContain("no longer available");
  });

  it("distinguishes outside-hours from unscheduled days", () => {
    expect(mapDatabaseError({ code: "SW003", message: "not scheduled" })).toBe(
      "The staff member is not working that day.",
    );
    expect(mapDatabaseError({ code: "SW003", message: "" })).toContain(
      "outside the staff member's working hours",
    );
  });

  it("uses database messages for workflow errors", () => {
    expect(mapDatabaseError({ code: "SW005", message: "Cannot do that." })).toBe(
      "Cannot do that.",
    );
    expect(mapDatabaseError({ code: "SW006", message: "Not found." })).toBe("Not found.");
    expect(mapDatabaseError({ code: "SW007", message: "Too early." })).toBe("Too early.");
  });

  it("maps permission and integrity codes without leaking internals", () => {
    expect(mapDatabaseError({ code: "42501", message: "permission denied for table appointments" })).toBe(
      "You do not have permission to do that.",
    );
    expect(mapDatabaseError({ code: "23505" })).toBe("That record already exists.");
    expect(mapDatabaseError({ code: "23503" })).toContain("no longer available");
    expect(mapDatabaseError({ code: "22023" })).toContain("not valid");
    expect(mapDatabaseError({ code: "22001" })).toContain("too long");
    expect(mapDatabaseError({ code: "XX000", message: "secret internals" })).toBe(
      "Something went wrong. Please try again.",
    );
    expect(mapDatabaseError(null)).toBe("Something went wrong. Please try again.");
  });
});

describe("fieldErrorsFromZod", () => {
  it("extracts only fields with messages", () => {
    const error = z
      .object({
        name: z.string().min(1, "Enter a name."),
        email: z.string().email("Enter a valid email."),
        notes: z.string().optional(),
      })
      .safeParse({ name: "", email: "nope" });
    expect(error.success).toBe(false);
    if (!error.success) {
      expect(fieldErrorsFromZod(error.error)).toEqual({
        name: ["Enter a name."],
        email: ["Enter a valid email."],
      });
    }
  });
});
