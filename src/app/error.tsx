"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const digest =
    error instanceof Error
      ? (error as Error & { digest?: string }).digest
      : undefined;

  useEffect(() => {
    console.error("[root-error]", { digest });
  }, [digest]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-destructive">
          Something went wrong
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          SlotWise couldn&apos;t load this workspace
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We couldn&apos;t prepare your workspace. This is usually temporary —
          try again, or return to the sign-in page if it continues.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={retry} className="gap-2">
            <RotateCcw className="size-4" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Go to sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
