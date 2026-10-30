"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", { digest: error.digest });
  }, [error.digest]);

  const isConfigError = error.message.startsWith("Supabase configuration is invalid");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-destructive">
          Something went wrong
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          This page couldn&apos;t be loaded
        </h1>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {isConfigError
            ? error.message
            : "We couldn't retrieve your workspace data. This is usually temporary — try again, or contact your administrator if it continues."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={retry} className="gap-2">
            <RotateCcw className="size-4" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to overview</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
