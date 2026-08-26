import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getJob } from "@/lib/field/api";
import { addJobReceipt, attachTicketCode } from "@/lib/field/api-account";
import { setTicketJobKind } from "@/lib/field/api-dispatch";
import { listCodes } from "@/lib/field/api-ops";
import { ExceptionTone } from "@/lib/field/status";
import { KIND_LABEL, hoursFromEntries, roughGrossProfit } from "@/lib/field/calc";
import { formatClock, formatHours, formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/spinner";
import type { JobKind } from "@/lib/field/types";

export const Route = createFileRoute("/app/jobs/$ticketId")({ component: JobDetail });

function JobDetail() {
  const { ticketId } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["job", ticketId], queryFn: () => getJob({ data: ticketId }) });
  const codesQ = useQuery({ queryKey: ["codes"], queryFn: () => listCodes() });
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");

  const attach = useMutation({
    mutationFn: attachTicketCode,
    onSuccess: () => {
      toast.success("Code attached");
      setCode("");
      void qc.invalidateQueries({ queryKey: ["job", ticketId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const receipt = useMutation({
    mutationFn: addJobReceipt,
    onSuccess: () => {
      toast.success("Receipt saved");
      setAmount("");
      setVendor("");
      void qc.invalidateQueries({ queryKey: ["job", ticketId] });
      void qc.invalidateQueries({ queryKey: ["exceptions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const kindMut = useMutation({
    mutationFn: setTicketJobKind,
    onSuccess: () => {
      toast.success("Ticket type saved");
      void qc.invalidateQueries({ queryKey: ["job", ticketId] });
      void qc.invalidateQueries({ queryKey: ["jobs"] });
      void qc.invalidateQueries({ queryKey: ["dispatch"] });
    },
  });

  if (q.isLoading) return <Spinner label="Opening job…" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { ticket, entries, parts, exceptions, receipts, profile } = q.data!;
  const tz = profile.settings.timezone;
  const hours = hoursFromEntries(entries);
  const onSite = (hours.billable + hours.show) / 60;
  const paid = hours.paid / 60;
  const delta = onSite - ticket.expectedHours;
  const receiptCost = receipts.reduce((s, r) => s + r.amount, 0);
  const laborValue =
    ticket.laborAmount ||
    ticket.codes.reduce((s, c) => s + c.laborValue, 0) ||
    ticket.expectedHours * profile.settings.laborRate;
  const gp = roughGrossProfit({
    laborValue,
    receiptCost,
    partsMarkup: profile.settings.partsMarkup,
    paidHours: paid,
    wage: profile.employee.hourlyWage,
  });
  const canManage = profile.employee.role !== "technician";
  const book = codesQ.data?.items ?? [];
  const allowance = ticket.codes.reduce((s, c) => {
    const row = book.find((b) => b.code === c.code);
    return s + (row?.partsAllowance ?? 0);
  }, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/app/jobs" className="text-sm text-muted hover:text-fg">
        ← Jobs
      </Link>
      <div>
        <div className="font-mono text-primary">#{ticket.ticketNumber}</div>
        <h1 className="text-2xl font-semibold tracking-tight">{ticket.customerName}</h1>
        <p className="text-sm text-muted">
          {ticket.addressLine}, {ticket.city}, {ticket.state} {ticket.zip}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ticket.jobKind === "callback" ? <Badge tone="warn">Callback</Badge> : null}
          {ticket.jobKind === "warranty" ? <Badge tone="info">Warranty</Badge> : null}
        </div>
        {canManage ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["service", "callback", "warranty"] as JobKind[]).map((k) => (
              <button
                key={k}
                type="button"
                className={`h-11 rounded-md text-sm capitalize ${
                  ticket.jobKind === k ? "bg-primary text-primary-fg" : "bg-elevated text-muted"
                }`}
                onClick={() => kindMut.mutate({ data: { ticketId: ticket.id, jobKind: k } })}
              >
                {k}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <div className="text-[11px] uppercase tracking-wide text-subtle">Sold / codes</div>
          <div className="font-mono text-xl tabular">{formatHours(ticket.expectedHours)}h</div>
          <div className="text-xs text-muted">{ticket.codes.map((c) => `${c.code} ${c.hoursExpected}`).join(" + ") || "No code"}</div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wide text-subtle">GPS on site</div>
          <div className="font-mono text-xl tabular">{formatHours(onSite)}h</div>
          <div className="text-xs text-muted">
            {delta > 0.1 ? "Time exceeds codes" : delta < -0.1 ? "Codes exceed time" : "Within tolerance"}
          </div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wide text-subtle">Paid on this job</div>
          <div className="font-mono text-xl tabular">{formatHours(paid)}h</div>
          <div className="text-xs text-muted">Unpaid {formatHours(hours.unpaid / 60)}h</div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wide text-subtle">Rough GP</div>
          <div className="font-mono text-xl tabular">{formatMoney(gp.gp)}</div>
          <div className="text-xs text-muted">
            Labor {formatMoney(laborValue)} · parts sell {formatMoney(gp.partsSell)}
          </div>
        </Card>
      </div>

      {canManage ? (
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Attach invoice / job code</h2>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!code.trim()) return;
              attach.mutate({ data: { ticketId: ticket.id, code } });
            }}
          >
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              list="job-codes"
              placeholder="Code"
              className="max-w-40"
            />
            <datalist id="job-codes">
              {book.filter((c) => c.active).map((c) => (
                <option key={c.id} value={c.code}>
                  {c.description} · {c.hours}h
                </option>
              ))}
            </datalist>
            <Button type="submit" size="sm" variant="secondary" disabled={attach.isPending}>
              Attach
            </Button>
          </form>
        </Card>
      ) : null}

      <Card>
        <h2 className="mb-3 text-sm font-semibold">Time on this ticket</h2>
        <ul className="space-y-2 text-sm">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-muted">{KIND_LABEL[e.kind] ?? e.kind}</span>
              <span className="font-mono tabular">
                {formatClock(e.clockIn, tz)} – {e.clockOut ? formatClock(e.clockOut, tz) : "open"}
              </span>
              <Badge tone={e.gpsBacked && e.paidMinutes > 0 ? "ok" : "warn"}>
                {e.paidMinutes > 0 ? "paid" : "unpaid"}
              </Badge>
            </li>
          ))}
          {entries.length === 0 ? <li className="text-muted">No punches yet — this is a missing-time flag until they clock.</li> : null}
        </ul>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Parts receipts vs code range</h2>
            <p className="text-xs text-muted">
              Code parts allowance {formatMoney(allowance)}. Markup {profile.settings.partsMarkup}×. Receipt cost{" "}
              {formatMoney(receiptCost)}.
            </p>
          </div>
        </div>
        <form
          className="mb-3 grid grid-cols-[1fr_1fr_auto] gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(amount);
            if (!(n > 0)) return;
            receipt.mutate({
              data: { ticketId: ticket.id, amount: n, vendor, code: ticket.codes[0]?.code },
            });
          }}
        >
          <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Receipt $" />
          <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Vendor" />
          <Button type="submit" size="sm" variant="secondary" disabled={receipt.isPending}>
            Add receipt
          </Button>
        </form>
        <ul className="space-y-2 text-sm">
          {receipts.map((r) => (
            <li key={r.id} className="flex justify-between gap-3">
              <span>
                {r.vendor || "Receipt"} {r.code ? `· ${r.code}` : ""}
              </span>
              <span className="font-mono">{formatMoney(r.amount)}</span>
            </li>
          ))}
          {parts.map((p) => (
            <li key={p.id} className="flex justify-between gap-3 text-muted">
              <span>
                {p.manufacturer} {p.part_number} · {p.description}
              </span>
              <span className="font-mono">
                ×{p.quantity} {formatMoney(p.unit_price)}
              </span>
            </li>
          ))}
          {receipts.length === 0 && parts.length === 0 ? <li className="text-muted">No receipts yet.</li> : null}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">Exceptions</h2>
        <ul className="space-y-2">
          {exceptions.map((x) => (
            <li key={x.id} className="flex items-start gap-2 text-sm">
              <ExceptionTone kind={x.kind} />
              <span className="text-muted">{x.message}</span>
            </li>
          ))}
          {exceptions.length === 0 ? <li className="text-sm text-muted">None.</li> : null}
        </ul>
      </Card>
    </div>
  );
}
