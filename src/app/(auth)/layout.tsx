import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const POINTS = [
  "A calendar that reads at a glance",
  "Database-enforced booking integrity",
  "Reports built from real completed visits",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.85fr)]">
      <div className="relative hidden overflow-hidden bg-nav p-10 text-nav-foreground lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_10%,rgba(45,212,191,0.14),transparent_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_90%_90%,rgba(99,102,241,0.12),transparent_100%)]"
          aria-hidden
        />

        <Link
          href="/"
          className="relative inline-flex w-fit rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-nav-active"
        >
          <Logo inverted />
        </Link>

        <div className="relative max-w-xl py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-nav-active">
            Appointment operations, refined
          </p>
          <h2 className="mt-4 font-serif text-[42px] leading-[1.08] tracking-[-0.02em] text-white xl:text-[52px]">
            A calmer day starts with every slot{" "}
            <span className="italic text-nav-active">in its place.</span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-nav-muted">
            Bring bookings, customers, and staff schedules into one considered
            workspace — built for the realities of a working service business.
          </p>

          <ul className="mt-8 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-sm text-nav-foreground/90">
                <CheckCircle2 className="size-4 text-nav-active" strokeWidth={1.8} />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between text-[11px] text-nav-muted">
          <span>© {new Date().getFullYear()} SlotWise</span>
          <span>One business. One clear calendar.</span>
        </div>
      </div>

      <div className="flex min-h-dvh flex-col bg-background">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:hidden">
          <Link href="/" aria-label="SlotWise home">
            <Logo />
          </Link>
          <Link href="/" className="text-xs font-medium text-muted-foreground hover:text-foreground">
            Back to site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-4 sm:px-8 lg:py-12">
          <div className="w-full max-w-[404px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
