import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your SlotWise workspace.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next);
  const initialError = params.error
    ? params.error === "missing_code"
      ? "That confirmation link is missing its code. Request a new link or sign in."
      : "That confirmation link is invalid or has expired. Try signing in, or create the account again."
    : undefined;

  return <LoginForm next={next} initialError={initialError} />;
}
