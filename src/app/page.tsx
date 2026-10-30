import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  Clock3,
  DatabaseZap,
  Globe2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CalendarPreview } from "@/components/marketing/calendar-preview";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: CalendarDays,
    title: "A calendar that reads at a glance",
    description:
      "Day, week, and month views with clear status colours, staff filters, and a mobile agenda. Your schedule should answer questions, not raise them.",
    accent: "bg-status-confirmed-soft text-status-confirmed",
  },
  {
    icon: ShieldCheck,
    title: "Double-bookings are structurally impossible",
    description:
      "Overlap protection lives in PostgreSQL, not a hopeful client check. Concurrent requests for the same slot end with exactly one booking.",
    accent: "bg-status-progress-soft text-status-progress",
  },
  {
    icon: Clock3,
    title: "Availability that tells the truth",
    description:
      "Working hours, recorded time off, service duration, and past-time rules shape every offered slot — all in your business time zone.",
    accent: "bg-status-pending-soft text-status-pending",
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: "Reports made from real visits",
    description:
      "Revenue comes from completed appointment snapshots, so catalogue edits never rewrite history. Filter by date and export a safe CSV.",
    accent: "bg-status-completed-soft text-status-completed",
  },
];

const WORKFLOW = [
  {
    number: "01",
    title: "Shape your catalogue",
    description:
      "Add the services you offer, their durations and prices, and the people who deliver them.",
  },
  {
    number: "02",
    title: "Map the working week",
    description:
      "Set one clear interval per weekday and record time off. Availability updates the moment you save.",
  },
  {
    number: "03",
    title: "Book, run, and review",
    description:
      "Create bookings from the calendar, move them through a considered status flow, and let the reports add up.",
  },
];

const SECURITY_POINTS = [
  "Row-level security on every business table",
  "Appointment writes locked behind security-definer functions",
  "Tenant-safe composite foreign keys across every reference",
  "Immutable service snapshots on each booking",
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden bg-hero-glow">
          <div
            className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_72%)]"
            aria-hidden
          />
          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 pb-24 pt-16 sm:px-8 sm:pb-28 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:pb-32 lg:pt-24">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3 py-1 text-[11px] font-medium text-primary shadow-sm backdrop-blur">
                <Sparkles className="size-3.5" />
                Appointment operations, without the drag
              </div>

              <h1 className="mt-5 text-[44px] font-semibold leading-[1.04] tracking-[-0.045em] text-foreground sm:text-[58px] lg:text-[64px]">
                Your day,
                <br />
                <span className="font-serif font-normal italic tracking-[-0.02em] text-primary">
                  perfectly slotted.
                </span>
              </h1>

              <p className="mt-5 max-w-[540px] text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
                SlotWise brings bookings, customers, and staff schedules into one
                considered workspace — so service businesses can spend less time
                arranging the day and more time running it.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="h-11 gap-2 px-5 shadow-lift">
                  <Link href="/signup">
                    Start free
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-11 border-border bg-white/70 px-5 backdrop-blur"
                >
                  <Link href="/login">Sign in to your workspace</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground">
                {["No double-bookings", "Time-zone honest", "Built for one business"].map(
                  (point) => (
                    <span key={point} className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-primary" strokeWidth={2.2} />
                      {point}
                    </span>
                  ),
                )}
              </div>

              <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                Salons · Studios · Repair shops · Consultants
              </p>
            </div>

            <div className="relative lg:pl-4">
              <CalendarPreview />
            </div>
          </div>
        </section>

        <section id="product" className="scroll-mt-20 border-t border-border/60 bg-background">
          <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Everything in its place
              </p>
              <h2 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.035em] sm:text-[40px]">
                Run the day without
                <span className="font-serif font-normal italic"> running around.</span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                Every screen is built around the same question: what does the day
                look like now, and what needs attention next?
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="group rounded-2xl border border-border/80 bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-7"
                  >
                    <span
                      className={`flex size-10 items-center justify-center rounded-xl ${feature.accent}`}
                    >
                      <Icon className="size-5" strokeWidth={1.8} />
                    </span>
                    <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.02em]">
                      {feature.title}
                    </h3>
                    <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span className="flex items-center gap-2">
                <Globe2 className="size-4 text-primary" />
                Times are displayed and validated in your configured business time zone.
              </span>
              <span className="flex items-center gap-2">
                <DatabaseZap className="size-4 text-primary" />
                Every metric on your dashboard comes from your own database records.
              </span>
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-20 bg-muted/40">
          <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  A considered workflow
                </p>
                <h2 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.035em] sm:text-[40px]">
                  Set up once.
                  <br />
                  <span className="font-serif font-normal italic">Run it daily.</span>
                </h2>
                <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
                  No operational maze. Shape your business, then let the calendar
                  carry the day.
                </p>
                <Button asChild variant="outline" className="mt-6 gap-2 bg-background">
                  <Link href="/signup">
                    Create your workspace
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>

              <ol className="relative space-y-4">
                {WORKFLOW.map((step) => (
                  <li
                    key={step.number}
                    className="grid gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-card sm:grid-cols-[64px_1fr] sm:p-6"
                  >
                    <span className="font-serif text-[34px] italic leading-none text-primary/70">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="text-[16px] font-semibold tracking-[-0.02em]">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="security" className="scroll-mt-20 bg-background">
          <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Guardrails, not good intentions
                </p>
                <h2 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.035em] sm:text-[40px]">
                  Your business rules,
                  <span className="font-serif font-normal italic"> enforced below the UI.</span>
                </h2>
                <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                  SlotWise treats the database as the last line of defence. Even a
                  crafted request cannot write around the booking rules.
                </p>

                <ul className="mt-7 space-y-3">
                  {SECURITY_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[13.5px]">
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="size-2.5 text-primary" strokeWidth={3} />
                      </span>
                      <span className="text-foreground/90">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-nav p-1 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.5)]">
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_50%_at_85%_0%,rgba(45,212,191,0.16),transparent_100%)]"
                  aria-hidden
                />
                <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <span className="size-2 rounded-full bg-rose-400/70" />
                    <span className="size-2 rounded-full bg-amber-300/70" />
                    <span className="size-2 rounded-full bg-emerald-400/70" />
                    <span className="ml-2 text-[10px] font-medium tracking-[0.08em] text-nav-muted">
                      appointments_no_overlap
                    </span>
                  </div>
                  <pre className="mt-4 overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-300 sm:text-[12px]">
                    <code>
                      <span className="text-slate-500">-- The database has the final say</span>
                      {"\n"}
                      <span className="text-teal-300">alter table</span> appointments
                      {"\n"}
                      <span className="text-teal-300">add constraint</span> appointments_no_overlap
                      {"\n"}
                      <span className="text-indigo-300">exclude using</span> gist (
                      {"\n  "}user_id <span className="text-amber-300">with</span> =,
                      {"\n  "}staff_id <span className="text-amber-300">with</span> =,
                      {"\n  "}tstzrange(start_at, end_at, <span className="text-emerald-300">&apos;[)&apos;</span>)
                      {" "}<span className="text-amber-300">with</span> &amp;&amp;
                      {"\n"})
                      {"\n"}<span className="text-teal-300">where</span> status <span className="text-amber-300">in</span> (
                      {"\n  "}<span className="text-emerald-300">&apos;pending&apos;</span>,
                      {" "}<span className="text-emerald-300">&apos;confirmed&apos;</span>,
                      {" "}<span className="text-emerald-300">&apos;in_progress&apos;</span>
                      {"\n"});
                    </code>
                  </pre>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {[
                      "Cancelled slots free up",
                      "Back-to-back is allowed",
                      "Concurrent writes resolve safely",
                      "Ownership validated twice",
                    ].map((item) => (
                      <span
                        key={item}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[10.5px] text-nav-muted"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background pb-20 sm:pb-24">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="relative overflow-hidden rounded-[2rem] bg-nav px-6 py-14 text-center shadow-[0_35px_80px_-35px_rgba(15,23,42,0.55)] sm:px-12 sm:py-16">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_0%,rgba(45,212,191,0.18),transparent_100%)]"
                aria-hidden
              />
              <div className="relative mx-auto max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-nav-active">
                  Ready when you are
                </p>
                <h2 className="mt-3 text-[34px] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[44px]">
                  Give every hour
                  <span className="font-serif font-normal italic"> a home.</span>
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-[14px] leading-relaxed text-nav-muted">
                  Set up your business in minutes. Bring your services, your team,
                  and your calendar into one clear place.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <Button asChild size="lg" className="h-11 gap-2 px-5">
                    <Link href="/signup">
                      Start free
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-11 border-white/15 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/login">Sign in</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Appointments, without the chaos.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              Create account
            </Link>
            <span>© {new Date().getFullYear()} SlotWise</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
