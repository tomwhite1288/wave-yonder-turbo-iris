import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Radio, ShieldCheck, Timer, MapPinned, BookOpen, Wallet } from "lucide-react";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { isPending } = useCurrentUserState();

  return (
    <main className="min-h-dvh bg-bg">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-md bg-surface text-primary shadow-[var(--shadow-border)]">
            <Radio className="size-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">Field Ledger</div>
            <div className="text-[11px] text-muted">Maichle's Edge</div>
          </div>
        </div>
        {isPending ? (
          <div className="h-9 w-24 animate-pulse rounded-md bg-elevated" />
        ) : (
          <>
            <SignedIn>
              <Button asChild size="sm">
                <Link to="/app">
                  Open board <ArrowRight className="size-4" />
                </Link>
              </Button>
            </SignedIn>
            <SignedOut>
              <Button asChild size="sm" variant="secondary">
                <Link to="/login" search={{}}>
                  Sign in
                </Link>
              </Button>
            </SignedOut>
          </>
        )}
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-16 pt-8 stagger-in">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Companion intelligence layer</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          Payroll, timecards, and job-site truth — without replacing dispatch.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted">
          Field Ledger sits beside the Maichle's Edge service platform. Tickets still live there. This system answers
          where the technician was, how long they worked, whether invoice codes match the hours, and what payroll should be.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/login" search={{ mode: "admin" }}>
              Administrator sign-in <ShieldCheck className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/login" search={{}}>
              Field team sign-in
            </Link>
          </Button>
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: MapPinned, title: "GPS attendance", body: "On site, approaching, working, left site — evidence, never silent payroll edits." },
            { icon: Timer, title: "Timekeeping engine", body: "Clock-in, billable vs non-billable, travel, admin, and immutable originals." },
            { icon: BookOpen, title: "Code validation", body: "A+C+B hours vs actual field time, with configurable ±15 minute tolerance." },
            { icon: Wallet, title: "Payroll estimates", body: "Historical wage rates, overtime, contribution after labor — not a paycheck processor." },
            { icon: ShieldCheck, title: "Exceptions & audit", body: "Under-billed, over-billed, left site, missing codes. Every edit keeps the original." },
            { icon: Radio, title: "Live board", body: "Managers see the fleet. Technicians get a mobile day view. Integration API in between." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <Icon className="size-5 text-primary" />
                <h2 className="mt-3 text-sm font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm text-muted">{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
