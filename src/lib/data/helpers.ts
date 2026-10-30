import "server-only";

import { logActionError } from "@/lib/errors";

export const DEFAULT_PAGE_SIZE = 20;

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function likePattern(value: string): string {
  return `%${escapeLike(value.trim().slice(0, 120))}%`;
}

export function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(Math.floor(parsed), 10_000);
}

export function parsePositiveInt(
  value: string | string[] | undefined,
  fallback: number,
): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

export function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw || undefined;
}

export function dataError(scope: string, error: unknown): never {
  logActionError(scope, error);
  throw new Error("We couldn't load this information. Please try again.");
}

export function pageCountFor(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
