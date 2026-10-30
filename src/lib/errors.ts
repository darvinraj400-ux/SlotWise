import type { ZodError } from "zod";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
      code?: string;
    };

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionFailure(
  message: string,
  fieldErrors?: Record<string, string[]>,
  code?: string,
): ActionResult<never> {
  return { ok: false, message, fieldErrors, code };
}

export function fieldErrorsFromZod(error: ZodError): Record<string, string[]> {
  const flattened = error.flatten();
  const fieldErrors = flattened.fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const result: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages && messages.length > 0) result[key] = messages;
  }
  return result;
}

type DatabaseErrorLike = {
  code?: string | null;
  message?: string | null;
} | null;

export function mapDatabaseError(error: DatabaseErrorLike): string {
  if (!error) return "Something went wrong. Please try again.";

  switch (error.code) {
    case "SW001":
    case "23P01":
      return "That time slot is no longer available. Choose another time.";
    case "SW002":
      return "Appointments must start in the future.";
    case "SW003":
      return error.message?.includes("not scheduled")
        ? "The staff member is not working that day."
        : "That time is outside the staff member's working hours.";
    case "SW004":
      return "The staff member is on time off during that slot.";
    case "SW005":
      return error.message || "That status change is not allowed.";
    case "SW006":
      return error.message || "A selected record is no longer available.";
    case "SW007":
      return error.message || "That action is not allowed at this time.";
    case "42501":
      return "You do not have permission to do that.";
    case "23505":
      return "That record already exists.";
    case "23503":
      return "A selected record is no longer available. Refresh and try again.";
    case "22023":
      return "One of the provided values is not valid.";
    case "22001":
      return "One of the provided values is too long.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function logActionError(scope: string, error: unknown) {
  if (error && typeof error === "object") {
    const record = error as { code?: string; message?: string };
    console.error(`[${scope}]`, {
      code: record.code ?? "unknown",
      message: record.message ?? "Unknown error",
    });
    return;
  }
  console.error(`[${scope}]`, { message: String(error) });
}
