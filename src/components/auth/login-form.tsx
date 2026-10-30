"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { SubmitButton } from "@/components/app/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/actions/auth";
import { INITIAL_FORM_STATE } from "@/lib/actions/types";

export function LoginForm({
  next,
  initialError,
}: {
  next: string;
  initialError?: string;
}) {
  const [state, formAction] = useActionState(loginAction, INITIAL_FORM_STATE);
  const errorMessage =
    state.status === "error" ? state.message : initialError;

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
        Welcome back
      </p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em]">
        Sign in to your workspace
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Pick up where you left off — your schedule, customers, and team are ready.
      </p>

      {errorMessage ? (
        <div
          role="alert"
          className="mt-5 flex gap-2.5 rounded-xl border border-status-cancelled-border bg-status-cancelled-soft p-3 text-[13px] leading-relaxed text-status-cancelled"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[13px] font-medium">
            Email address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@business.com"
              className="h-10 pl-9"
              aria-invalid={Boolean(state.fieldErrors?.email)}
              aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
              required
            />
          </div>
          {state.fieldErrors?.email ? (
            <p id="email-error" role="alert" className="text-xs font-medium text-destructive">
              {state.fieldErrors.email[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[13px] font-medium">
            Password
          </Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              className="h-10 pl-9"
              aria-invalid={Boolean(state.fieldErrors?.password)}
              aria-describedby={
                state.fieldErrors?.password ? "password-error" : undefined
              }
              required
            />
          </div>
          {state.fieldErrors?.password ? (
            <p id="password-error" role="alert" className="text-xs font-medium text-destructive">
              {state.fieldErrors.password[0]}
            </p>
          ) : null}
        </div>

        <SubmitButton
          className="h-10 w-full"
          pendingLabel="Signing in…"
          size="lg"
        >
          Sign in
        </SubmitButton>
      </form>

      <p className="mt-5 text-center text-[13px] text-muted-foreground">
        New to SlotWise?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>

      <div className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5" />
        Sessions are secured by Supabase Auth
      </div>

      <Button asChild variant="ghost" size="sm" className="mt-4 w-full text-muted-foreground">
        <Link href="/">← Back to the website</Link>
      </Button>
    </div>
  );
}
