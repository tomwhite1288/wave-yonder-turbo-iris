import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Radio, ShieldCheck, Timer, MapPinned, BookOpen, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
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
        <Link to="/login" className={cn(buttonVariants({ size: "sm" }))}>
          Sign in <ArrowRight className="size-4" />
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-16 pt-8 stagger-in">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Companion intelligence layer</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          Dispatch, payroll, and job-site truth — beside the service platform, not instead of it.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted">
          Field Ledger is the Maichle's Edge companion for the office desk and the truck. Tickets still key off Ticket
          Number. This system runs the dispatch board, GPS attendance, invoice vs plumbing vs HVAC codes, and payroll.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/login" className={cn(buttonVariants())}>
            Sign in <ArrowRight className="size-4" />
          </Link>
          <a href="/get/Field-Ledger-shop.zip" download="Field-Ledger-shop.zip" className={cn(buttonVariants({ variant: "secondary" }))}>
            Download shop copy
          </a>
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: MapPinned, title: "GPS attendance", body: "On site, approaching, working, left site — evidence, never silent payroll edits." },
            { icon: Timer, title: "Timekeeping engine", body: "Clock-in, billable vs non-billable, travel, admin, and immutable originals." },
            { icon: BookOpen, title: "Code validation", body: "A+C+B hours vs actual field time, with configurable ±15 minute tolerance." },
            { icon: Wallet, title: "Payroll estimates", body: "Historical wage rates, overtime, contribution after labor — not a paycheck processor." },
            { icon: ShieldCheck, title: "Exceptions & audit", body: "Under-billed, over-billed, left site, missing codes. Every edit keeps the original." },
            { icon: Radio, title: "Dispatch board", body: "Shift / day / week timeline, drag-assign work orders, live GPS map. Companion desk — not a clone of invoicing." },
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
