"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { fieldErrorsFromZod } from "@/lib/errors";
import { loginSchema, signupSchema } from "@/lib/validation/schemas";
import { formString } from "@/lib/validation/form";
import type { FormState } from "./types";

function authErrorMessage(code: string | undefined, message: string | undefined) {
  const normalized = `${code ?? ""} ${message ?? ""}`.toLowerCase();

  if (normalized.includes("invalid_credentials")) {
    return "That email and password combination doesn't match.";
  }
  if (normalized.includes("email_not_confirmed")) {
    return "Confirm your email address before signing in. Check your inbox for the link.";
  }
  if (normalized.includes("user_already_exists")) {
    return "An account with that email already exists. Try signing in instead.";
  }
  if (normalized.includes("weak_password")) {
    return "That password is too weak. Use at least 8 characters with a letter and a number.";
  }
  if (normalized.includes("rate_limit") || normalized.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (normalized.includes("signup_disabled")) {
    return "New account creation is currently disabled.";
  }
  return "We couldn't complete that request. Please try again.";
}

export async function loginAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch (error) {
    console.error(
      `[auth.login] ${error instanceof Error ? error.message : "Configuration error"}`,
    );
    return {
      status: "error",
      message: "Sign-in is not configured. Check the Supabase environment variables.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    console.error("[auth.login]", { code: error.code, status: error.status });
    return {
      status: "error",
      message: authErrorMessage(error.code, error.message),
    };
  }

  redirect(safeRedirectPath(formString(formData, "next")));
}

export async function signupAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    businessName: formString(formData, "businessName"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  let supabase;
  let siteUrl: string;
  try {
    supabase = await createClient();
    siteUrl = getSiteUrl();
  } catch (error) {
    console.error(
      `[auth.signup] ${error instanceof Error ? error.message : "Configuration error"}`,
    );
    return {
      status: "error",
      message: "Sign-up is not configured. Check the Supabase environment variables.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { business_name: parsed.data.businessName },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    console.error("[auth.signup]", { code: error.code, status: error.status });
    return {
      status: "error",
      message: authErrorMessage(error.code, error.message),
    };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    status: "success",
    message:
      "Check your inbox to confirm your email address. Once confirmed, you can sign in.",
  };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
