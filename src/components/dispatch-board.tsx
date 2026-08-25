import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { assignWorkOrder, createWorkOrder, getDispatchDesk } from "@/lib/field/api-dispatch";
import { GpsBadge } from "@/lib/field/status";
import { LiveMap } from "@/components/live-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatClock, initials, todayIso } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { LiveTechRow, TicketSummary } from "@/lib/field/types";

type Span = "shift" | "day" | "week";
type WoTab = "unassigned" | "assigned" | "completed";

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00-04:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function hoursFor(span: Span) {
  if (span === "shift") return range(7, 17);
  return range(6, 20);
}
function range(start: number, end: number) {
  const out: number[] = [];
  for (let h = start; h < end; h += 1) out.push(h);
  return out;
}
function labelHour(h: number) {
  const am = h < 12;
  const n = h % 12 === 0 ? 12 : h % 12;
  return `${n}${am ? "a" : "p"}`;
}
function stampOn(dateIso: string, hour: number) {
  const hh = String(Math.floor(hour)).padStart(2, "0");
  const mm = String(Math.round((hour % 1) * 60)).padStart(2, "0");
  return `${dateIso}T${hh}:${mm}:00-04:00`;
}
function hourOf(iso: string | null, fallback: number) {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.getHours() + d.getMinutes() / 60;
}

export function DispatchBoard() {
  const qc = useQueryClient();
  const desk = useQuery({
    queryKey: ["dispatch"],
    queryFn: () => getDispatchDesk(),
    refetchInterval: 15_000,
  });
  const [span, setSpan] = useState<Span>("shift");
  const [date, setDate] = useState(() => todayIso());
  const [tab, setTab] = useState<WoTab>("unassigned");
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const assign = useMutation({
    mutationFn: assignWorkOrder,
    onSuccess: () => {
      toast.success("Assigned");
      void qc.invalidateQueries({ queryKey: ["dispatch"] });
      void qc.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (desk.isLoading) return <div className="h-[32rem] animate-pulse rounded-xl bg-surface" />;
  if (desk.error) return <p className="text-sm text-danger">{desk.error.message}</p>;
  const data = desk.data!;
  const tz = data.profile.settings.timezone;
  const hours = hoursFor(span);
  const startH = hours[0] ?? 7;
  const endH = (hours[hours.length - 1] ?? 16) + 1;
  const techs = data.people;
  const liveBy = new Map(data.rows.map((r) => [r.employee.id, r]));

  const weekDates = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(date, i - new Date(`${date}T12:00:00-04:00`).getDay()));

  const jobs = data.tickets.filter((t) => {
    if (!t.scheduledStart) return true;
    const day = t.scheduledStart.slice(0, 10);
    if (span === "week") return weekDates.includes(day);
    return day === date;
  });

  const list = data.tickets.filter((t) => {
    if (tab === "completed") return t.status === "complete";
    if (t.status === "complete") return false;
    if (tab === "unassigned") return !t.technicianId;
    return Boolean(t.technicianId);
  }).filter((t) => {
    if (!q.trim()) return true;
    const hay = `${t.ticketNumber} ${t.customerName} ${t.addressLine} ${t.workDetail ?? ""}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  function dropOn(techId: string, ev: React.DragEvent, hour?: number) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("text/job-id");
    if (!id) return;
    assign.mutate({
      data: {
        ticketId: id,
        technicianId: techId,
        appointmentStart: stampOn(date, hour ?? startH + 1),
      },
    });
  }

  const working = data.rows.filter((r) => r.clockedIn || r.gpsStatus === "WORKING").length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold tracking-tight">Dispatch Board</h1>
        <div className="flex rounded-md bg-surface shadow-[var(--shadow-border)]">
          {(["shift", "day", "week"] as Span[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpan(s)}
              className={cn("h-9 px-3 text-xs font-medium capitalize", span === s ? "bg-primary text-primary-fg" : "text-muted")}
            >
              {s === "day" ? "Full Day" : s === "shift" ? "Shift" : "Week"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="secondary" onClick={() => setDate(addDays(date, span === "week" ? -7 : -1))} aria-label="Previous">
            <ChevronLeft className="size-4" />
          </Button>
          <p className="min-w-40 text-center text-sm font-medium">
            {span === "week" ? `Week of ${weekDates[0]}` : date}
          </p>
          <Button size="sm" variant="secondary" onClick={() => setDate(addDays(date, span === "week" ? 7 : 1))} aria-label="Next">
            <ChevronRight className="size-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setDate(todayIso())}>Today</Button>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Create Work Order
        </Button>
      </div>

      {data.profile.settings.dispatchShowTiles ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Technicians" value={String(techs.length)} />
          <Stat label="Working" value={String(working)} />
          <Stat label="Open jobs" value={String(data.tickets.filter((t) => t.status !== "complete").length)} />
          <Stat label="Exceptions" value={String(data.openExceptions)} />
        </div>
      ) : null}

      {span === "week" ? (
        <WeekGrid techs={techs} days={weekDates} jobs={data.tickets} liveBy={liveBy} onDrop={dropOn} />
      ) : (
        <div className="min-h-0 overflow-auto rounded-lg bg-surface shadow-[var(--shadow-border)]">
          <div className="min-w-[720px] pb-4">
            <div
              className="grid border-b border-border text-[11px] font-medium uppercase tracking-wide text-muted"
              style={{ gridTemplateColumns: `11rem repeat(${hours.length}, minmax(4.5rem, 1fr))` }}
            >
              <div className="px-3 py-2">Technicians</div>
              {hours.map((h) => (
                <div key={h} className="border-l border-border px-1 py-2 text-center">{labelHour(h)}</div>
              ))}
            </div>
            {techs.map((tech, i) => {
              const live = liveBy.get(tech.id);
              const mine = jobs.filter((t) => t.technicianId === tech.id && t.status !== "complete");
              return (
                <TechRow
                  key={tech.id}
                  name={tech.name}
                  title={`${tech.department}${live ? ` · ${live.gpsStatus.replace("_", " ")}` : ""}`}
                  online={Boolean(live?.clockedIn)}
                  ago={live?.lastGpsAt ? formatClock(live.lastGpsAt, tz) : "No GPS"}
                  hours={hours}
                  jobs={mine}
                  startH={startH}
                  endH={endH}
                  stripe={i % 2 === 1}
                  nowPct={date === todayIso() ? ((new Date().getHours() + new Date().getMinutes() / 60 - startH) / (endH - startH)) * 100 : null}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const box = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - box.left - 176;
                    const pct = Math.max(0, x) / Math.max(1, box.width - 176);
                    dropOn(tech.id, e, startH + pct * (endH - startH));
                  }}
                />
              );
            })}
            {techs.length === 0 ? <p className="px-3 py-8 text-sm text-muted">No technicians on the roster yet.</p> : null}
          </div>
        </div>
      )}

      <div className={cn("grid shrink-0 gap-3", data.profile.settings.dispatchShowMap ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]" : "")}>
        <section className="flex min-h-56 flex-col overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-border)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
            <p className="mr-auto text-sm font-semibold">Work Orders</p>
            {(["unassigned", "assigned", "completed"] as WoTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn("h-8 rounded-md px-2.5 text-xs font-medium capitalize", tab === t ? "bg-primary text-primary-fg" : "text-muted hover:bg-elevated")}
              >
                {t}
              </button>
            ))}
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer, ID, address" className="h-8 w-48" />
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface text-[10px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">ID</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">Address</th>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">Task</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-muted">Nothing in this list. Create a work order or import tickets.</td></tr>
                ) : list.map((t) => (
                  <tr
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/job-id", t.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    className="cursor-grab border-t border-border hover:bg-elevated"
                  >
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link to="/app/jobs/$ticketId" params={{ ticketId: t.id }} className="text-primary hover:underline">#{t.ticketNumber}</Link>
                    </td>
                    <td className="px-3 py-2">{t.customerName}</td>
                    <td className="hidden px-3 py-2 text-muted sm:table-cell">{t.addressLine}</td>
                    <td className="px-3 py-2 tabular-nums text-muted">{t.scheduledStart ? formatClock(t.scheduledStart, tz) : "—"}</td>
                    <td className="hidden max-w-48 truncate px-3 py-2 text-muted md:table-cell">{t.workDetail || t.technicianName || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        {data.profile.settings.dispatchShowMap ? (
          <section className="min-h-56 overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-border)]">
            <LiveMap rows={data.rows} compact />
          </section>
        ) : null}
      </div>

      {createOpen ? (
        <CreateOrder
          techs={techs}
          date={date}
          onClose={() => setCreateOpen(false)}
          onCreated={(assigned) => {
            setCreateOpen(false);
            if (assigned) setTab("assigned");
            void qc.invalidateQueries({ queryKey: ["dispatch"] });
          }}
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <div className="text-xl font-semibold tabular">{value}</div>
      <div className="text-xs uppercase tracking-wide text-subtle">{label}</div>
    </Card>
  );
}

function TechRow({
  name, title, online, ago, hours, jobs, startH, endH, stripe, nowPct, onDragOver, onDrop,
}: {
  name: string;
  title: string;
  online: boolean;
  ago: string;
  hours: number[];
  jobs: TicketSummary[];
  startH: number;
  endH: number;
  stripe: boolean;
  nowPct: number | null;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const span = endH - startH;
  return (
    <div
      className={cn("relative grid border-b border-border", stripe && "bg-elevated/40")}
      style={{ gridTemplateColumns: `11rem repeat(${hours.length}, minmax(4.5rem, 1fr))`, minHeight: "4.75rem" }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-elevated text-[11px] font-semibold">{initials(name)}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-[10px] text-muted">{title} · {ago}</p>
        </div>
        <span className={cn("ml-auto size-2 shrink-0 rounded-full", online ? "bg-ok" : "bg-border")} />
      </div>
      {hours.map((h) => <div key={h} className="border-l border-border" />)}
      <div className="pointer-events-none absolute inset-y-0 overflow-visible" style={{ left: "11rem", right: 0 }}>
        {nowPct != null && nowPct >= 0 && nowPct <= 100 ? (
          <div className="absolute inset-y-0 w-px bg-primary/70" style={{ left: `${nowPct}%` }} />
        ) : null}
        {jobs.map((t) => {
          const a = hourOf(t.scheduledStart, startH + 1);
          const b = hourOf(t.scheduledEnd, a + Math.max(1, t.expectedHours || 1.5));
          const left = ((a - startH) / span) * 100;
          const width = Math.max(8, ((b - a) / span) * 100);
          return (
            <Link
              key={t.id}
              to="/app/jobs/$ticketId"
              params={{ ticketId: t.id }}
              className="pointer-events-auto absolute top-3 h-8 overflow-hidden rounded-md bg-primary/20 px-2 text-[11px] font-medium text-fg"
              style={{ left: `${Math.max(0, left)}%`, width: `${Math.min(100 - Math.max(0, left), width)}%` }}
            >
              #{t.ticketNumber} {t.customerName}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  techs, days, jobs, liveBy, onDrop,
}: {
  techs: { id: string; name: string }[];
  days: string[];
  jobs: TicketSummary[];
  liveBy: Map<string, LiveTechRow>;
  onDrop: (techId: string, ev: React.DragEvent) => void;
}) {
  return (
    <div className="overflow-auto rounded-lg bg-surface shadow-[var(--shadow-border)]">
      <table className="min-w-[860px] w-full text-left text-sm">
        <thead className="text-[11px] uppercase tracking-wide text-muted">
          <tr className="border-b border-border">
            <th className="px-3 py-2">Tech</th>
            {days.map((d) => (
              <th key={d} className="px-3 py-2">{d.slice(5)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {techs.map((t) => (
            <tr key={t.id} className="border-b border-border/70">
              <td className="px-3 py-2">
                <div className="font-medium">{t.name}</div>
                {liveBy.get(t.id) ? <GpsBadge status={liveBy.get(t.id)!.gpsStatus} /> : null}
              </td>
              {days.map((d) => (
                <td
                  key={d}
                  className="px-2 py-2 align-top"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(t.id, e)}
                >
                  {jobs.filter((j) => j.technicianId === t.id && j.scheduledStart?.slice(0, 10) === d).map((j) => (
                    <div key={j.id} className="mb-1 rounded-md bg-elevated px-2 py-1 text-[11px]">#{j.ticketNumber} {j.customerName}</div>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateOrder({
  techs, date, onClose, onCreated,
}: {
  techs: { id: string; name: string }[];
  date: string;
  onClose: () => void;
  onCreated: (assigned: boolean) => void;
}) {
  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("New Castle");
  const [ticket, setTicket] = useState("");
  const [task, setTask] = useState("");
  const [tech, setTech] = useState("");
  const [start, setStart] = useState("08:00");
  const mut = useMutation({
    mutationFn: createWorkOrder,
    onSuccess: (res) => {
      toast.success(`Work order #${res.ticketNumber}`);
      onCreated(Boolean(tech));
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-bg/70 p-4 sm:place-items-center">
      <Card className="w-full max-w-lg space-y-3 p-5">
        <h2 className="text-lg font-semibold">Create Work Order</h2>
        <Input placeholder="Ticket # (blank = next)" value={ticket} onChange={(e) => setTicket(e.target.value)} />
        <Input placeholder="Customer name" value={customer} onChange={(e) => setCustomer(e.target.value)} />
        <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input placeholder="Task / work detail" value={task} onChange={(e) => setTask(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          <select className="h-11 rounded-md border border-border bg-elevated px-3 text-sm" value={tech} onChange={(e) => setTech(e.target.value)}>
            <option value="">Unassigned</option>
            {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={mut.isPending || !customer.trim()}
            onClick={() =>
              mut.mutate({
                data: {
                  ticketNumber: ticket,
                  customerName: customer,
                  addressLine: address,
                  city,
                  appointmentStart: `${date}T${start}:00-04:00`,
                  technicianId: tech || null,
                  workDetail: task,
                },
              })
            }
          >
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
}
