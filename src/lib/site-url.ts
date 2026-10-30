export const LOCAL_SITE_URL = "http://localhost:3000";

type SiteUrlEnvironment = {
  NEXT_PUBLIC_SITE_URL?: string;
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  VERCEL_URL?: string;
};

function normalizeSiteUrl(raw: string, variable: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${variable} must be an absolute http(s) URL.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${variable} must use http or https.`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`${variable} must not include credentials.`);
  }
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error(`${variable} must be an origin without a path, query, or hash.`);
  }

  return parsed.origin;
}

function isLoopback(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  );
}

export function getSiteUrl(env: SiteUrlEnvironment = process.env): string {
  const configured = env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    const siteUrl = normalizeSiteUrl(configured, "NEXT_PUBLIC_SITE_URL");
    if (env.VERCEL_ENV && isLoopback(new URL(siteUrl).hostname)) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL must be the public deployment origin when running on Vercel.",
      );
    }
    return siteUrl;
  }

  if (env.NODE_ENV !== "production") {
    return LOCAL_SITE_URL;
  }

  if (env.VERCEL_ENV === "preview" && env.VERCEL_URL?.trim()) {
    return normalizeSiteUrl(`https://${env.VERCEL_URL.trim()}`, "VERCEL_URL");
  }

  throw new Error(
    "NEXT_PUBLIC_SITE_URL is required in production. Set it to the canonical https origin for this deployment. Vercel preview deployments may omit it to use VERCEL_URL.",
  );
}
