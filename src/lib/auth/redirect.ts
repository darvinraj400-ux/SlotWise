const FALLBACK = "/dashboard";

export function safeRedirectPath(
  value: string | null | undefined,
  fallback = FALLBACK,
): string {
  if (!value) return fallback;

  const trimmed = value.trim();

  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    /[\u0000-\u001f]/.test(trimmed)
  ) {
    return fallback;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed, "https://slotwise.local");
  } catch {
    return fallback;
  }

  if (parsed.origin !== "https://slotwise.local") {
    return fallback;
  }

  const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;

  if (
    parsed.pathname === "/login" ||
    parsed.pathname === "/signup" ||
    parsed.pathname.startsWith("/auth/")
  ) {
    return fallback;
  }

  return path;
}
