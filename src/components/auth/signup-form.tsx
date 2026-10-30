"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  LockKeyhole,
  Mail,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { SubmitButton } from "@/components/app/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction } from "@/lib/actions/auth";
import { INITIAL_FORM_STATE } from "@/lib/actions/types";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, INITIAL_FORM_STATE);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-border bg-card p-7 text-center shadow-card">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-status-confirmed-soft text-status-confirmed">
          <MailCheck className="size-6" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          Check your inbox
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {state.message}
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
        Get started
      </p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em]">
        Create your workspace
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        One business, one calendar. Set up your services and team in minutes.
      </p>

      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="mt-5 flex gap-2.5 rounded-xl border border-status-cancelled-border bg-status-cancelled-soft p-3 text-[13px] leading-relaxed text-status-cancelled"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{state.message}</p>
        </div>
      ) : null}

      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="businessName" className="text-[13px] font-medium">
            Business name
          </Label>
          <div className="relative">
            <BriefcaseBusiness className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="businessName"
              name="businessName"
              autoComplete="organization"
              placeholder="e.g. Northside Barbers"
              className="h-10 pl-9"
              aria-invalid={Boolean(state.fieldErrors?.businessName)}
              aria-describedby={
                state.fieldErrors?.businessName ? "businessName-error" : undefined
              }
              required
            />
          </div>
          <FieldError
            id="businessName-error"
            message={state.fieldErrors?.businessName?.[0]}
          />
        </div>

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
          <FieldError id="email-error" message={state.fieldErrors?.email?.[0]} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="h-10 pl-9"
                aria-invalid={Boolean(state.fieldErrors?.password)}
                aria-describedby={
                  state.fieldErrors?.password ? "password-error" : "password-hint"
                }
                required
              />
            </div>
            <FieldError
              id="password-error"
              message={state.fieldErrors?.password?.[0]}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-[13px] font-medium">
              Confirm password
            </Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat password"
                className="h-10 pl-9"
                aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
                aria-describedby={
                  state.fieldErrors?.confirmPassword
                    ? "confirmPassword-error"
                    : undefined
                }
                required
              />
            </div>
            <FieldError
              id="confirmPassword-error"
              message={state.fieldErrors?.confirmPassword?.[0]}
            />
          </div>
        </div>

        <p
          id="password-hint"
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <CheckCircle2 className="size-3.5 text-status-completed" />
          Use 8+ characters with at least one letter and one number.
        </p>

        <SubmitButton
          className="h-10 w-full"
          pendingLabel="Creating workspace…"
          size="lg"
        >
          Create workspace
        </SubmitButton>
      </form>

      <p className="mt-5 text-center text-[13px] text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>

      <div className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5" />
        Your data stays isolated and protected by row-level security
      </div>
    </div>
  );
}
