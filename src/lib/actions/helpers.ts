import "server-only";

import {
  actionFailure,
  logActionError,
  mapDatabaseError,
} from "@/lib/errors";

const EXPECTED_CODES = new Set([
  "SW001",
  "SW002",
  "SW003",
  "SW004",
  "SW005",
  "SW006",
  "SW007",
  "23P01",
  "23505",
  "23503",
  "23514",
  "42501",
  "22023",
  "22001",
  "22P02",
]);

type DatabaseErrorLike = { code?: string | null; message?: string | null } | null;

export function databaseFailure(scope: string, error: DatabaseErrorLike) {
  if (!error?.code || !EXPECTED_CODES.has(error.code)) {
    logActionError(scope, error);
  }
  return actionFailure(
    mapDatabaseError(error),
    undefined,
    error?.code ?? undefined,
  );
}

export function nullableText(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
