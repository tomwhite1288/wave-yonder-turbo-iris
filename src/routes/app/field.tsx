import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { clockOut, getFieldToday, pingGps, setJobSiteToHere, submitNote, transitionClock } from "@/lib/field/api";
import { addJobReceipt } from "@/lib/field/api-account";
import { useGps } from "@/lib/field/use-gps";
import { GpsBadge } from "@/lib/field/status";
import { KIND_LABEL } from "@/lib/field/calc";
import { formatClock, formatDuration, formatHours } from "@/lib/utils";
import { Spinner } from "@/components/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { haversineMeters, metersToFeet, resolveGpsStatus } from "@/lib/field/geo";
import type { GpsStatus, TimeKind } from "@/lib/field/types";

export const Route = createFileRoute("/app/field")({ ssr: false, component: FieldPage });

function FieldPage() {
  const qc = useQueryClient();
  const field = useQuery({ queryKey: ["field"], queryFn: () => getFieldToday(), refetchInterval: 20_000 });
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [receiptAmt, setReceiptAmt] = useState("");
  const [receiptVendor, setReceiptVendor] = useState("");

  const data = field.data;
  const ticket = data?.tickets.find((t) => t.id === selected) ?? data?.currentTicket ?? data?.tickets[0] ?? null;
  const pingMut = useMutation({
    mutationFn: pingGps,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["field"] });
      void qc.invalidateQueries({ queryKey: ["dispatch"] });
    },
  });
  const gps = useGps(Boolean(data), data?.profile.settings.gpsIntervalSec ?? 300, (fix) => {
    pingMut.mutate({ data: { ticketId: ticket?.id, lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy } });
  });

  const switchMut = useMutation({
    mutationFn: transitionClock,
    onSuccess: (res) => {
      const min = res.confirmMin ?? 15;
      toast.success(res.gpsBacked ? "Status updated — GPS confirmed" : `Status posted — GPS has ${min} min to confirm`);
      void qc.invalidateQueries({ queryKey: ["field"] });
      void qc.invalidateQueries({ queryKey: ["dispatch"] });
      void qc.invalidateQueries({ queryKey: ["exceptions"] });
      void qc.invalidateQueries({ queryKey: ["inbox"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const outMut = useMutation({
    mutationFn: clockOut,
    onSuccess: (res) => {
      toast.success(res.gpsBacked ? "Clocked out — paid" : "Clocked out — time not paid");
      void qc.invalidateQueries({ queryKey: ["field"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const noteMut = useMutation({
    mutationFn: submitNote,
    onSuccess: () => {
      setNote("");
      toast.success("Note submitted");
      void qc.invalidateQueries({ queryKey: ["field"] });
    },
  });
  const siteMut = useMutation({
    mutationFn: setJobSiteToHere,
    onSuccess: () => {
      toast.success("Job site set to this location");
      void qc.invalidateQueries({ queryKey: ["field"] });
    },
  });
  const receiptMut = useMutation({
    mutationFn: addJobReceipt,
    onSuccess: () => {
      setReceiptAmt("");
      setReceiptVendor("");
      toast.success("Receipt posted against the code parts range");
      void qc.invalidateQueries({ queryKey: ["field"] });
      void qc.invalidateQueries({ queryKey: ["exceptions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (field.isLoading) return <Spinner label="Loading today’s jobs…" />;
  if (field.error) return <p className="text-sm text-danger">{field.error.message}</p>;
  if (!data) return null;

  const tz = data.profile.settings.timezone;
  const hours = data.hours;
  const settings = data.profile.settings;
  const distanceFt =
    gps.fix && ticket?.lat != null && ticket.lng != null
      ? metersToFeet(haversineMeters(gps.fix.lat, gps.fix.lng, ticket.lat, ticket.lng))
      : null;
  const officeFt = gps.fix
    ? metersToFeet(haversineMeters(gps.fix.lat, gps.fix.lng, settings.officeLat, settings.officeLng))
    : null;
  const status: GpsStatus = resolveGpsStatus({
    hasFix: Boolean(gps.fix),
    distanceFt,
    radiusFt: ticket?.gpsRadiusFt ?? settings.gpsRadiusFt,
    approachingMultiplier: settings.approachingMultiplier,
    clockedIn: Boolean(data.open && (data.open.kind === "work" || data.open.kind === "show")),
    previouslyOnSite: data.open?.gpsStatus === "WORKING" || data.open?.gpsStatus === "ON_SITE",
    officeDistanceFt: officeFt,
    officeRadiusFt: settings.officeRadiusFt,
    accuracyM: gps.fix?.accuracy ?? null,
  });
  const expected = ticket?.expectedHours ?? 0;
  const busy = switchMut.isPending || outMut.isPending;

  function punch(kind: TimeKind) {
    switchMut.mutate({
      data: {
        ticketId: ticket?.id,
        lat: gps.fix?.lat ?? null,
        lng: gps.fix?.lng ?? null,
        accuracy: gps.fix?.accuracy ?? null,
        kind,
      },
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-subtle">Today</p>
          <h1 className="text-2xl font-semibold tracking-tight">{data.profile.employee.name}</h1>
          <p className="text-xs text-muted">
            Paid: in transit, show, working, office at {settings.officeAddress}.
          </p>
        </div>
        <GpsBadge status={status} />
      </div>

      {gps.error ? (
        <Card className="flex items-center justify-between gap-3">
          <p className="text-sm text-warn">{gps.error}</p>
          <Button size="sm" variant="secondary" onClick={gps.request}>
            Enable location
          </Button>
        </Card>
      ) : null}

      <Card className="rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-wide text-subtle">Current ticket</div>
        {ticket ? (
          <>
            <Link
              to="/app/jobs/$ticketId"
              params={{ ticketId: ticket.id }}
              className="mt-1 block font-mono text-lg text-primary"
            >
              #{ticket.ticketNumber}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <div className="text-sm font-medium">{ticket.customerName}</div>
              {ticket.jobKind === "callback" ? <Badge tone="warn">Callback</Badge> : null}
              {ticket.jobKind === "warranty" ? <Badge tone="info">Warranty</Badge> : null}
            </div>
            <div className="text-sm text-muted">
              {ticket.addressLine}, {ticket.city}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Metric label="Status" value={data.open ? KIND_LABEL[data.open.kind] : "Off the clock"} />
              <Metric
                label="GPS"
                value={
                  data.open?.gpsConfirmStatus === "pending"
                    ? `Confirming (${settings.gpsConfirmMin} min)`
                    : data.open?.gpsConfirmStatus === "failed"
                      ? "Not confirmed — needs approval"
                      : data.open?.gpsConfirmStatus === "confirmed"
                        ? "Confirmed on site"
                        : gps.fix
                          ? "Live"
                          : "Waiting"
                }
              />
              <Metric label="Since" value={data.open ? formatClock(data.open.clockIn, tz) : "—"} />
              <Metric label="Paid today" value={formatHours(hours.paid / 60)} />
              <Metric label="Unpaid" value={formatHours(hours.unpaid / 60)} />
              <Metric label="Codes" value={ticket.codes.map((c) => c.code).join(" + ") || "—"} />
              <Metric label="Sold hours" value={`${formatHours(expected)} h`} />
            </div>
            <div className="mt-2 text-xs text-muted">
              {gps.fix
                ? `${gps.fix.lat.toFixed(5)}, ${gps.fix.lng.toFixed(5)} ±${Math.round(gps.fix.accuracy)} m`
                : "Waiting for GPS"}
              {distanceFt != null
                ? ` · ${Math.round(distanceFt)} ft from job (radius ${Math.round(ticket.gpsRadiusFt + (gps.fix ? gps.fix.accuracy * 3.28084 : 0))} ft with accuracy)`
                : ticket.lat == null
                  ? " · this job has no pin yet — confirm location below"
                  : ""}
              {officeFt != null ? ` · ${Math.round(officeFt)} ft from shop` : ""}
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">No assigned jobs today. Office allocation still works.</p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={busy} onClick={() => punch("travel")}>
            In transit
          </Button>
          <Button variant="secondary" disabled={!ticket || busy} onClick={() => punch("show")}>
            On site
          </Button>
          <Button disabled={!ticket || busy} onClick={() => punch("work")}>
            Working
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => punch("office")}>
            At office
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={busy} onClick={() => punch("break")}>
            Break
          </Button>
          {data.open ? (
            <Button
              variant="ghost"
              disabled={outMut.isPending}
              onClick={() => {
                outMut.mutate({
                  data: {
                    lat: gps.fix?.lat ?? null,
                    lng: gps.fix?.lng ?? null,
                    accuracy: gps.fix?.accuracy ?? null,
                    ticketId: ticket?.id,
                  },
                });
              }}
            >
              Clock out
            </Button>
          ) : (
            <Button variant="outline" onClick={gps.request}>
              Request GPS
            </Button>
          )}
        </div>
        {gps.fix && ticket ? (
          <Button
            className="mt-2 w-full"
            variant="secondary"
            onClick={() => siteMut.mutate({ data: { ticketId: ticket.id, lat: gps.fix!.lat, lng: gps.fix!.lng } })}
          >
            {ticket.lat == null ? "Pin this job to my location" : "Update job pin to my location"}
          </Button>
        ) : null}
        {gps.fix ? (
          <Button className="mt-2 w-full" variant="outline" onClick={gps.request}>
            Confirm GPS now
          </Button>
        ) : null}
      </Card>

      {data.tickets.length > 1 ? (
        <Card>
          <div className="mb-2 text-[11px] uppercase tracking-wide text-subtle">Assigned jobs</div>
          <div className="space-y-1">
            {data.tickets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelected(t.id)}
                className={`flex h-12 w-full items-center justify-between rounded-md px-2 text-left text-sm ${ticket?.id === t.id ? "bg-elevated" : "hover:bg-elevated/60"}`}
              >
                <span className="font-mono">#{t.ticketNumber}</span>
                <span className="truncate text-muted">
                  {t.customerName}
                  {t.jobKind === "callback" ? " · callback" : t.jobKind === "warranty" ? " · warranty" : ""}
                </span>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="text-[11px] uppercase tracking-wide text-subtle">Today — payable vs clocked</div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Metric label="Paid" value={formatHours(hours.paid / 60)} />
          <Metric label="Unpaid" value={formatHours(hours.unpaid / 60)} />
          <Metric label="Drive" value={formatHours(hours.travel / 60)} />
          <Metric label="On site" value={formatHours((hours.billable + hours.show) / 60)} />
          <Metric label="Office" value={formatHours(hours.office / 60)} />
          <Metric label="Break" value={formatDuration(hours.breakMin)} />
        </div>
      </Card>

      {ticket ? (
        <Card>
          <div className="mb-2 text-[11px] uppercase tracking-wide text-subtle">Parts receipt</div>
          <p className="mb-3 text-xs text-muted">
            Enter the vendor receipt total. Ledger compares it to the code parts range and posts rough gross
            profit on the job — not a petty-cash lump.
          </p>
          <form
            className="grid grid-cols-[1fr_1fr_auto] gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const amount = Number(receiptAmt);
              if (!ticket || !(amount > 0)) return;
              receiptMut.mutate({
                data: {
                  ticketId: ticket.id,
                  amount,
                  vendor: receiptVendor,
                  code: ticket.codes[0]?.code,
                },
              });
            }}
          >
            <Input
              inputMode="decimal"
              value={receiptAmt}
              onChange={(e) => setReceiptAmt(e.target.value)}
              placeholder="Receipt $"
            />
            <Input value={receiptVendor} onChange={(e) => setReceiptVendor(e.target.value)} placeholder="Vendor" />
            <Button type="submit" size="sm" variant="secondary" disabled={receiptMut.isPending}>
              Add
            </Button>
          </form>
        </Card>
      ) : null}

      <Card>
        <div className="mb-2 text-[11px] uppercase tracking-wide text-subtle">Note / exception</div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!note.trim()) return;
            noteMut.mutate({ data: { ticketId: ticket?.id, message: note } });
          }}
        >
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Late parts, access issue…" />
          <Button type="submit" size="sm" variant="secondary">
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-subtle">{label}</div>
      <div className="font-mono text-sm tabular">{value}</div>
    </div>
  );
}
