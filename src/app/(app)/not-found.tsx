import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Logo className="mb-8" />
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          404
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          We couldn&apos;t find that record
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          It may have been removed, or the link may be out of date. Head back to your
          workspace to keep going.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Back to overview</Link>
        </Button>
      </div>
    </div>
  );
}
