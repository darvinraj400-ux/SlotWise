import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient, type TypedSupabaseClient } from "@/lib/supabase/server";
import type { BusinessSettings } from "@/lib/types";
import { logActionError } from "@/lib/errors";

type AuthContext = {
  supabase: TypedSupabaseClient;
  user: User | null;
  settings: BusinessSettings | null;
};

async function loadSettings(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<BusinessSettings | null> {
  const { data, error } = await supabase
    .from("business_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logActionError("settings.load", error);
    return null;
  }
  return data;
}

function fallbackBusinessName(user: User): string {
  if (typeof user.user_metadata?.business_name === "string") {
    const trimmed = user.user_metadata.business_name.trim();
    if (trimmed) return trimmed.slice(0, 120);
  }
  const localPart = user.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (!localPart) return "My business";
  return localPart
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .slice(0, 120);
}

async function ensureSettings(
  supabase: TypedSupabaseClient,
  user: User,
): Promise<BusinessSettings | null> {
  const existing = await loadSettings(supabase, user.id);
  if (existing) return existing;

  const { error } = await supabase.from("business_settings").insert({
    user_id: user.id,
    business_name: fallbackBusinessName(user),
  });

  if (error && error.code !== "23505") {
    logActionError("settings.create", error);
    return null;
  }

  return loadSettings(supabase, user.id);
}

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, settings: null };
  }

  const settings = await ensureSettings(supabase, user);
  return { supabase, user, settings };
});

export type RequireSession = {
  supabase: TypedSupabaseClient;
  user: User;
  settings: BusinessSettings;
};

export async function requireSession(): Promise<RequireSession> {
  const context = await getAuthContext();

  if (!context.user) {
    redirect("/login");
  }

  if (!context.settings) {
    throw new Error(
      "Your business settings could not be loaded. Check your database connection and row level security policies.",
    );
  }

  return {
    supabase: context.supabase,
    user: context.user,
    settings: context.settings,
  };
}
