export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

  const problems: string[] = [];

  if (!url) {
    problems.push("NEXT_PUBLIC_SUPABASE_URL is missing.");
  } else {
    const parsed = parseUrl(url);
    if (!parsed) {
      problems.push("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
    } else {
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        problems.push("NEXT_PUBLIC_SUPABASE_URL must use http or https.");
      }
      if (parsed.pathname !== "/" && parsed.pathname !== "") {
        problems.push(
          "NEXT_PUBLIC_SUPABASE_URL must be the project base URL, not an API endpoint such as /rest/v1.",
        );
      }
    }
  }

  if (!publishableKey) {
    problems.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing.");
  } else if (publishableKey.length < 20) {
    problems.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY looks too short.");
  }

  if (problems.length > 0) {
    throw new Error(
      `Supabase configuration is invalid:\n- ${problems.join("\n- ")}\nSee .env.example for the expected values.`,
    );
  }

  return {
    url: url.replace(/\/+$/, ""),
    publishableKey,
  };
}

export function hasSupabaseConfig() {
  try {
    getSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}
