import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { clockIn, clockOut, getFieldToday, pingGps, setJobSiteToHere, submitNote } from "@/lib/field/api";
import { useGps } from "@/lib/field/use-gps";
import { GpsBadge } from "@/lib/field/status";
import { formatClock, formatDuration, formatHours } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resolveGpsStatus } from "@/lib/field/geo";
import { haversineMeters, metersToFeet } from "@/lib/field/geo";
import type { GpsStatus } from "@/lib/field/types";

export const Route = createFileRoute("/app/field")({ component: FieldPage });

function FieldPage() {
  const qc = useQueryClient();
  const field = useQuery({ queryKey: ["field"], queryFn: () => getFieldToday(), refetchInterval: 20_000 });
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const data = field.data;
  const ticket = data?.tickets.find((t) => t.id === selected) ?? data?.currentTicket ?? data?.tickets[0] ?? null;
  const tracking = Boolean(data?.open) || Boolean(data && !data.profile.settings.trackingOnlyDuringWork);

  const pingMut = useMutation({
    mutationFn: pingGps,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["field"] }),
  });

  const gps = useGps(Boolean(data) && tracking, data?.profile.settings.gpsIntervalSec ?? 30, (fix) => {
    pingMut.mutate({ data: { ticketId: ticket?.id, lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy } });
  });

  const inMut = useMutation({
    mutationFn: clockIn,
    onSuccess: () => {
      toast.success("Clocked in");
      void qc.invalidateQueries({ queryKey: ["field"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const outMut = useMutation({
    mutationFn: clockOut,
    onSuccess: () => {
      toast.success("Clocked out");
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

  if (field.isLoading) return <div className="h-80 animate-pulse rounded-xl bg-surface" />;
  if (field.error) return <p className="text-sm text-danger">{field.error.message}</p>;
  if (!data) return null;

  const tz = data.profile.settings.timezone;
  const hours = data.hours;
  const distanceFt =
    gps.fix && ticket?.lat != null && ticket.lng != null
      ? metersToFeet(haversineMeters(gps.fix.lat, gps.fix.lng, ticket.lat, ticket.lng))
      : null;
  const status: GpsStatus = resolveGpsStatus({
    hasFix: Boolean(gps.fix),
    distanceFt,
    radiusFt: ticket?.gpsRadiusFt ?? data.profile.settings.gpsRadiusFt,
    approachingMultiplier: data.profile.settings.approachingMultiplier,
    clockedIn: Boolean(data.open && data.open.kind === "work"),
    previouslyOnSite: data.open?.gpsStatus === "WORKING" || data.open?.gpsStatus === "ON_SITE",
  });
  const expected = ticket?.expectedHours ?? 0;
  const actualBillable = hours.billable / 60;
  const canManage = data.profile.employee.role !== "technician";

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-subtle">Today</p>
          <h1 className="text-2xl font-semibold tracking-tight">{data.profile.employee.name}</h1>
          {data.profile.employee.role !== "technician" ? (
            <p className="text-xs text-muted">Admin field view — pick a job to demo GPS clock-in.</p>
          ) : null}
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
            <div className="mt-1 text-sm font-medium">{ticket.customerName}</div>
            <div className="text-sm text-muted">
              {ticket.addressLine}, {ticket.city}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Metric label="Arrival" value={data.open ? formatClock(data.open.clockIn, tz) : "—"} />
              <Metric label="Duration" value={data.open ? formatDuration((Date.now() - new Date(data.open.clockIn).getTime()) / 60000) : "—"} />
              <Metric label="Billable" value={formatHours(actualBillable)} />
              <Metric label="Non-billable" value={formatHours(hours.nonBillable / 60)} />
              <Metric label="Codes" value={ticket.codes.map((c) => c.code).join(" + ") || "—"} />
              <Metric label="Expected" value={`${formatHours(expected)} h`} />
            </div>
            <div className="mt-2 text-xs text-muted">
              {distanceFt != null ? `${Math.round(distanceFt)} ft from job site · radius ${ticket.gpsRadiusFt} ft` : "Waiting for GPS fix"}
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">No assigned jobs today.</p>
        )}

        <div className="mt-5 space-y-2">
          {data.open ? (
            <Button
              className="w-full"
              variant="secondary"
              disabled={!gps.fix || outMut.isPending}
              onClick={() => {
                if (!gps.fix) return;
                outMut.mutate({ data: { lat: gps.fix.lat, lng: gps.fix.lng, accuracy: gps.fix.accuracy, ticketId: ticket?.id } });
              }}
            >
              Clock out
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={!gps.fix || !ticket || inMut.isPending}
              onClick={() => {
                if (!gps.fix || !ticket) return;
                inMut.mutate({
                  data: { ticketId: ticket.id, lat: gps.fix.lat, lng: gps.fix.lng, accuracy: gps.fix.accuracy, kind: "work" },
                });
              }}
            >
              Start work
            </Button>
          )}
          {!gps.fix ? (
            <Button className="w-full" variant="outline" onClick={gps.request}>
              Request GPS permission
            </Button>
          ) : null}
          {canManage && gps.fix && ticket ? (
            <Button
              className="w-full"
              variant="ghost"
              onClick={() =>
                siteMut.mutate({ data: { ticketId: ticket.id, lat: gps.fix!.lat, lng: gps.fix!.lng } })
              }
            >
              Set this job site to my location
            </Button>
          ) : null}
        </div>
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
                <span className="truncate text-muted">{t.customerName}</span>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="text-[11px] uppercase tracking-wide text-subtle">Today's hours</div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Metric label="Worked" value={formatHours(hours.worked / 60)} />
          <Metric label="Billable" value={formatHours(hours.billable / 60)} />
          <Metric label="Travel" value={formatHours(hours.travel / 60)} />
          <Metric label="Admin" value={formatHours(hours.admin / 60)} />
        </div>
      </Card>

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
