import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getSettings, saveSettings } from "@/lib/field/api-ops";
import { getAdminEmails, saveAdminEmails, setAdminAccessCode, redeemUnlockCode } from "@/lib/field/api-admin";
import { exportWeekPack } from "@/lib/field/api-account";
import { Check } from "lucide-react";
import { DEFAULT_PAY_CONDITIONS, PAID_KIND_OPTIONS } from "@/lib/field/calc";
import { DEFAULT_ROLE_NAV, NAV_CATALOG, THEMES } from "@/lib/field/nav";
import type { NavId, PaidKind, PayConditions, Role } from "@/lib/field/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { downloadText } from "@/lib/utils";
import { Spinner } from "@/components/spinner";
import { RadiusCalibrator } from "@/components/radius-calibrator";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

type Tab = "pay" | "office" | "payroll" | "look" | "sync" | "access" | "backup";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "pay", label: "Payable time", hint: "What GPS will pay" },
  { id: "office", label: "Shop address", hint: "Office geofence" },
  { id: "payroll", label: "Payroll", hint: "OT and tax" },
  { id: "look", label: "Appearance", hint: "Theme and nav" },
  { id: "sync", label: "Sync", hint: "Office computer" },
  { id: "access", label: "Access", hint: "Demo lock" },
  { id: "backup", label: "Backup", hint: "Files" },
];

function SettingsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("pay");
  const q = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const emailsQ = useQuery({
    queryKey: ["admin-emails"],
    queryFn: () => getAdminEmails(),
    enabled: q.data?.profile.employee.role === "admin",
  });
  const mut = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast.success("Saved");
      void qc.invalidateQueries({ queryKey: ["settings"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
      void qc.invalidateQueries({ queryKey: ["dispatch"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const codeMut = useMutation({
    mutationFn: setAdminAccessCode,
    onSuccess: () => {
      toast.success("Administrator code updated");
      setCurrentCode("");
      setNextCode("");
      void qc.invalidateQueries({ queryKey: ["admin-login-meta"] });
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const emailMut = useMutation({
    mutationFn: saveAdminEmails,
    onSuccess: () => {
      toast.success("Admin emails saved");
      void qc.invalidateQueries({ queryKey: ["admin-emails"] });
      void qc.invalidateQueries({ queryKey: ["settings"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const exportMut = useMutation({
    mutationFn: () => exportWeekPack(),
    onSuccess: async (pack) => {
      downloadText(`timecards-${pack.from}.csv`, pack.csv.timecards, "text/csv");
      downloadText(`payroll-${pack.from}.csv`, pack.csv.payroll, "text/csv");
      downloadText(`jobs-${pack.from}.csv`, pack.csv.jobs, "text/csv");
      downloadText(`receipts-${pack.from}.csv`, pack.csv.receipts, "text/csv");
      downloadText(`field-ledger-${pack.from}.json`, JSON.stringify(pack.json, null, 2), "application/json");
      if (pack.emailBody) {
        try {
          await navigator.clipboard.writeText(pack.emailBody);
          toast.success("Week files downloaded. Hours email copied to clipboard.");
        } catch {
          downloadText(`hours-email-${pack.from}.txt`, pack.emailBody, "text/plain");
          toast.success("Week files downloaded. Hours email saved as a text file.");
        }
      }
      const url = (syncUrl || s?.officeSyncUrl || "").replace(/\/$/, "");
      const key = syncKey || s?.officeSyncKey || "";
      if (url && key) {
        try {
          const res = await fetch(`${url}/api/sync`, {
            method: "PUT",
            headers: { "content-type": "application/json", "x-sync-key": key },
            body: JSON.stringify({ rev: Date.now(), data: pack.json }),
          });
          if (!res.ok) throw new Error(await res.text());
          toast.success("Week files downloaded and pushed to the office server");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Office push failed — files still downloaded");
        }
      } else if (!pack.emailBody) {
        toast.success("Week files downloaded");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const s = q.data?.profile.settings;
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [currentCode, setCurrentCode] = useState("");
  const [nextCode, setNextCode] = useState("");
  const [emails, setEmails] = useState<string>();
  const [syncUrl, setSyncUrl] = useState<string>();
  const [syncKey, setSyncKey] = useState<string>();
  const [unlockCode, setUnlockCode] = useState("");
  const unlockMut = useMutation({
    mutationFn: () => redeemUnlockCode({ data: { code: unlockCode } }),
    onSuccess: () => {
      toast.success("Field Ledger is licensed for this shop");
      setUnlockCode("");
      void qc.invalidateQueries({ queryKey: ["profile"] });
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <Spinner label="Loading company rules…" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  if (!s) return null;
  if (q.data?.profile.employee.role !== "admin") {
    return <p className="text-sm text-muted">Administrator access required.</p>;
  }

  const v = (key: string, fallback: string | number | boolean) => draft[key] ?? String(fallback);
  const set = (key: string, value: string) => setDraft((d) => ({ ...d, [key]: value }));
  const save = (data: Record<string, string | number | boolean>) => mut.mutate({ data });

  const paid = new Set(s.paidKinds);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Company rules</h1>
        <p className="text-sm text-muted">
          Control what field time the office will pay, confirm the shop geofence, and keep a portable backup.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-border pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`h-11 shrink-0 border-b-2 px-3 text-sm ${
              tab === t.id ? "border-primary text-fg" : "border-transparent text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pay" ? (
        <Card className="space-y-5 rounded-2xl p-5">
          <div>
            <h2 className="text-sm font-semibold">Payable statuses</h2>
            <p className="mt-1 text-sm text-muted">
              Technicians only get paid for the statuses you enable, and only when GPS agrees. Breaks and
              unmatched claims stay on the timecard as unpaid.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {PAID_KIND_OPTIONS.map((opt) => {
              const on = paid.has(opt.id);
              return (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl p-4 shadow-[var(--shadow-border)] ${
                    on ? "bg-elevated" : "bg-bg"
                  }`}
                >
                  <span
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-sm ${
                      on ? "bg-primary text-primary-fg" : "bg-elevated shadow-[var(--shadow-border)]"
                    }`}
                  >
                    {on ? <Check className="size-3" /> : null}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{opt.label}</span>
                    <span className="text-xs text-muted">{opt.hint}</span>
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() => {
                      const next = new Set(paid);
                      if (on) next.delete(opt.id);
                      else next.add(opt.id);
                      const kinds: PaidKind[] = PAID_KIND_OPTIONS.map((o) => o.id).filter((id) => next.has(id));
                      save({ paid_kinds: JSON.stringify(kinds.length ? kinds : ["work"]) });
                    }}
                  />
                </label>
              );
            })}
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={s.requireGpsForPay}
              onChange={(e) => save({ require_gps_for_pay: e.target.checked })}
            />
            <span>
              <span className="block font-medium">Require GPS to pay (global default)</span>
              <span className="text-xs text-muted">
                Per-status conditions below override this. A punch still posts instantly; GPS has the confirm
                window to catch up.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={s.paySoldHours}
              onChange={(e) => save({ pay_sold_hours: e.target.checked })}
            />
            <span>
              <span className="block font-medium">Pay sold / code hours if finished early</span>
              <span className="text-xs text-muted">
                A 3-hour code completed in 2 hours still claims 3 sold hours. The tech is not penalized for being fast.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={s.gpsFailFlagsWork}
              onChange={(e) => save({ gps_fail_flags_work: e.target.checked })}
            />
            <span>
              <span className="block font-medium">Working + GPS miss auto-flags the weekly timecard</span>
              <span className="text-xs text-muted">
                If GPS never matches the job during the confirm window, the associated tickets need approval.
              </span>
            </span>
          </label>
          <div>
            <span className="mb-2 block text-xs uppercase tracking-wide text-subtle">GPS confirm window</span>
            <p className="mb-2 text-xs text-muted">
              Status hits the board immediately. GPS has this long to prove they are where the punch says.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 15].map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => save({ gps_confirm_min: min })}
                  className={`h-11 rounded-md text-sm ${
                    Number(s.gpsConfirmMin) === min ? "bg-primary text-primary-fg" : "bg-elevated text-muted"
                  }`}
                >
                  {min} min
                </button>
              ))}
            </div>
          </div>
          <PayConditionsEditor
            value={s.payConditions ?? DEFAULT_PAY_CONDITIONS}
            onSave={(next) => save({ pay_conditions: JSON.stringify(next) })}
          />
          <div>
            <span className="mb-2 block text-xs uppercase tracking-wide text-subtle">Efficiency alert</span>
            <p className="mb-2 text-xs text-muted">
              Sold hours ÷ available hours. Notify the owner when a tech drops below this live percentage.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[70, 75, 80, 85].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => save({ efficiency_alert_pct: pct })}
                  className={`h-11 rounded-md text-sm ${
                    Number(s.efficiencyAlertPct) === pct ? "bg-primary text-primary-fg" : "bg-elevated text-muted"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
            <Field
              label="Custom %"
              value={v("efficiency_alert_pct", s.efficiencyAlertPct)}
              onChange={(x) => set("efficiency_alert_pct", x)}
            />
          </div>
          <RadiusCalibrator
            lat={Number(v("office_lat", s.officeLat))}
            lng={Number(v("office_lng", s.officeLng))}
            radiusFt={Number(v("gps_radius_ft", s.gpsRadiusFt))}
            label="Job-site radius"
            onChange={(ft) => set("gps_radius_ft", String(ft))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Job-site radius (ft)"
              value={v("gps_radius_ft", s.gpsRadiusFt)}
              onChange={(x) => set("gps_radius_ft", x)}
            />
            <Field
              label="Code vs time tolerance (min)"
              value={v("exception_tolerance_min", s.exceptionToleranceMin)}
              onChange={(x) => set("exception_tolerance_min", x)}
            />
          </div>
          <div>
            <span className="mb-2 block text-xs uppercase tracking-wide text-subtle">GPS push interval</span>
            <p className="mb-2 text-xs text-muted">
              Phone stores the last point, then pushes it on this schedule. Separate from the confirm window above.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { sec: 60, label: "1 min" },
                { sec: 300, label: "5 min" },
                { sec: 900, label: "15 min" },
                { sec: 1800, label: "30 min" },
              ].map((opt) => (
                <button
                  key={opt.sec}
                  type="button"
                  onClick={() => save({ gps_interval_sec: opt.sec })}
                  className={`h-11 rounded-md text-sm ${
                    Number(s.gpsIntervalSec) === opt.sec ? "bg-primary text-primary-fg" : "bg-elevated text-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.travelCountsAsField}
              onChange={(e) => save({ travel_counts_as_field: e.target.checked })}
            />
            Count in-transit toward field utilization
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.trackingOnlyDuringWork}
              onChange={(e) => save({ tracking_only_during_work: e.target.checked })}
            />
            Track GPS only while clocked in
          </label>
          <div>
            <span className="mb-2 block text-xs uppercase tracking-wide text-subtle">Available hours source (ST)</span>
            <div className="grid grid-cols-2 gap-2">
              {(["schedule", "clock"] as const).map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => save({ efficiency_available_source: src })}
                  className={`h-11 rounded-md text-sm ${
                    s.efficiencyAvailableSource === src ? "bg-primary text-primary-fg" : "bg-elevated text-muted"
                  }`}
                >
                  {src === "schedule" ? "Scheduled week" : "Clocked hours"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Billable efficiency = sold (code) hours ÷ this available pool — the ServiceTitan manager view.
            </p>
          </div>
          <Button
            onClick={() =>
              save({
                gps_radius_ft: Number(v("gps_radius_ft", s.gpsRadiusFt)),
                exception_tolerance_min: Number(v("exception_tolerance_min", s.exceptionToleranceMin)),
                gps_interval_sec: Number(v("gps_interval_sec", s.gpsIntervalSec)),
                approaching_multiplier: Number(v("approaching_multiplier", s.approachingMultiplier)),
                gps_confirm_min: Number(v("gps_confirm_min", s.gpsConfirmMin)),
                efficiency_alert_pct: Number(v("efficiency_alert_pct", s.efficiencyAlertPct)),
              })
            }
          >
            Save GPS rules
          </Button>
        </Card>
      ) : null}

      {tab === "office" ? (
        <Card className="space-y-4 rounded-2xl p-5">
          <div>
            <h2 className="text-sm font-semibold">Stock office / warehouse</h2>
            <p className="mt-1 text-sm text-muted">
              Office allocation is only paid when the device is inside this geofence. Default is the New Castle shop.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={v("office_name", s.officeName)} onChange={(x) => set("office_name", x)} />
            <Field label="Street" value={v("office_address", s.officeAddress)} onChange={(x) => set("office_address", x)} />
            <Field label="City" value={v("office_city", s.officeCity)} onChange={(x) => set("office_city", x)} />
            <Field label="State" value={v("office_state", s.officeState)} onChange={(x) => set("office_state", x)} />
            <Field label="ZIP" value={v("office_zip", s.officeZip)} onChange={(x) => set("office_zip", x)} />
            <Field
              label="Office radius (ft)"
              value={v("office_radius_ft", s.officeRadiusFt)}
              onChange={(x) => set("office_radius_ft", x)}
            />
            <Field label="Latitude" value={v("office_lat", s.officeLat)} onChange={(x) => set("office_lat", x)} />
            <Field label="Longitude" value={v("office_lng", s.officeLng)} onChange={(x) => set("office_lng", x)} />
          </div>
          <RadiusCalibrator
            lat={Number(v("office_lat", s.officeLat))}
            lng={Number(v("office_lng", s.officeLng))}
            radiusFt={Number(v("office_radius_ft", s.officeRadiusFt))}
            label="Shop geofence"
            onChange={(ft) => set("office_radius_ft", String(ft))}
            onUseHere={(lat, lng) => {
              set("office_lat", String(lat));
              set("office_lng", String(lng));
              save({ office_lat: lat, office_lng: lng });
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!navigator.geolocation) {
                  toast.error("This device has no GPS");
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    save({
                      office_lat: pos.coords.latitude,
                      office_lng: pos.coords.longitude,
                    });
                    toast.success("Shop pin set to this device");
                  },
                  (err) => toast.error(err.message),
                  { enableHighAccuracy: true, timeout: 20_000 },
                );
              }}
            >
              I am at the shop — use this GPS
            </Button>
            <Button
              onClick={() =>
                save({
                  office_name: v("office_name", s.officeName),
                  office_address: v("office_address", s.officeAddress),
                  office_city: v("office_city", s.officeCity),
                  office_state: v("office_state", s.officeState),
                  office_zip: v("office_zip", s.officeZip),
                  office_radius_ft: Number(v("office_radius_ft", s.officeRadiusFt)),
                  office_lat: Number(v("office_lat", s.officeLat)),
                  office_lng: Number(v("office_lng", s.officeLng)),
                })
              }
            >
              Save shop address
            </Button>
          </div>
        </Card>
      ) : null}

      {tab === "payroll" ? (
        <Card className="space-y-4 rounded-2xl p-5">
          <div>
            <h2 className="text-sm font-semibold">Wage estimate</h2>
            <p className="mt-1 text-sm text-muted">
              Weekly overtime, default labor sell rate, plumbing parts markup, and withholding used on the
              payroll screen. Historical wage rows are never overwritten.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Weekly OT after (hours)"
              value={v("overtime_weekly_hours", s.overtimeWeeklyHours)}
              onChange={(x) => set("overtime_weekly_hours", x)}
            />
            <Field
              label="OT multiplier"
              value={v("overtime_multiplier", s.overtimeMultiplier)}
              onChange={(x) => set("overtime_multiplier", x)}
            />
            <Field label="Labor sell rate" value={v("labor_rate", s.laborRate)} onChange={(x) => set("labor_rate", x)} />
            <Field
              label="Parts markup (×)"
              value={v("parts_markup", s.partsMarkup)}
              onChange={(x) => set("parts_markup", x)}
            />
            <Field
              label="Federal withholding %"
              value={v("payroll_fed_pct", s.payrollFedPct)}
              onChange={(x) => set("payroll_fed_pct", x)}
            />
            <Field
              label="DE state %"
              value={v("payroll_state_pct", s.payrollStatePct)}
              onChange={(x) => set("payroll_state_pct", x)}
            />
            <Field
              label="FICA %"
              value={v("payroll_fica_pct", s.payrollFicaPct)}
              onChange={(x) => set("payroll_fica_pct", x)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.doubleTimeEnabled}
              onChange={(e) => save({ double_time_enabled: e.target.checked })}
            />
            Double-time after 4 overtime hours
          </label>
          <Button
            onClick={() =>
              save({
                overtime_weekly_hours: Number(v("overtime_weekly_hours", s.overtimeWeeklyHours)),
                overtime_multiplier: Number(v("overtime_multiplier", s.overtimeMultiplier)),
                labor_rate: Number(v("labor_rate", s.laborRate)),
                parts_markup: Number(v("parts_markup", s.partsMarkup)),
                payroll_fed_pct: Number(v("payroll_fed_pct", s.payrollFedPct)),
                payroll_state_pct: Number(v("payroll_state_pct", s.payrollStatePct)),
                payroll_fica_pct: Number(v("payroll_fica_pct", s.payrollFicaPct)),
              })
            }
          >
            Save payroll rules
          </Button>
        </Card>
      ) : null}

      {tab === "sync" ? (
        <Card className="space-y-4 rounded-2xl p-5">
          <div>
            <h2 className="text-sm font-semibold">Office computer sync</h2>
            <p className="mt-1 text-sm text-muted">
              Phones keep GPS locally and push on the interval above. The office Python window receives the same
              company blob the hosted site writes here.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Office server URL"
              value={syncUrl ?? s.officeSyncUrl}
              onChange={setSyncUrl}
              placeholder="http://192.168.x.x:8080"
            />
            <Field
              label="Company sync key"
              value={syncKey ?? s.officeSyncKey}
              onChange={setSyncKey}
              placeholder="at least 6 characters"
            />
          </div>
          <Button
            onClick={() =>
              save({
                office_sync_url: syncUrl ?? s.officeSyncUrl,
                office_sync_key: syncKey ?? s.officeSyncKey,
                setup_complete: true,
              })
            }
          >
            Save sync
          </Button>
        </Card>
      ) : null}

      {tab === "look" ? (
        <div className="space-y-4">
          <Card className="space-y-3 rounded-2xl p-5">
            <h2 className="text-sm font-semibold">Shop theme</h2>
            <p className="text-xs text-muted">
              One look for the whole office. Only the administrator account changes this — it is not per technician.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => save({ theme_id: t.id })}
                  className={`rounded-xl px-3 py-3 text-left shadow-[var(--shadow-border)] ${
                    s.themeId === t.id ? "bg-primary text-primary-fg" : "bg-elevated text-fg"
                  }`}
                >
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className={`text-xs ${s.themeId === t.id ? "text-primary-fg/80" : "text-muted"}`}>{t.hint}</div>
                </button>
              ))}
            </div>
          </Card>
          <Card className="space-y-3 rounded-2xl p-5">
            <h2 className="text-sm font-semibold">Computer vs phone</h2>
            <div className="grid grid-cols-3 gap-2">
              {(["auto", "desktop", "mobile"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => save({ layout_mode: m })}
                  className={`h-11 rounded-md text-sm capitalize ${
                    s.layoutMode === m ? "bg-primary text-primary-fg" : "bg-elevated text-muted"
                  }`}
                >
                  {m === "auto" ? "Auto" : m === "desktop" ? "Computer" : "Phone"}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.dispatchShowMap}
                onChange={(e) => save({ dispatch_show_map: e.target.checked })}
              />
              Live map on the computer dispatch board
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.dispatchShowTiles}
                onChange={(e) => save({ dispatch_show_tiles: e.target.checked })}
              />
              KPI tiles above the computer board
            </label>
          </Card>
          <Card className="space-y-3 rounded-2xl p-5">
            <h2 className="text-sm font-semibold">Phone dock</h2>
            <p className="text-xs text-muted">
              Technicians use the five tabs below. Supervisors default to Board, Flags, Eff, Jobs, Hours.
              Administrators default to Board, Flags, Eff, People, Setup.
            </p>
            <DockEditor value={s.mobileDock} onSave={(ids) => save({ mobile_dock: JSON.stringify(ids) })} />
          </Card>
          <Card className="space-y-3 rounded-2xl p-5">
            <h2 className="text-sm font-semibold">Role screens</h2>
            <RoleNavEditor value={s.roleNav} onSave={(next) => save({ role_nav: JSON.stringify(next) })} />
          </Card>
        </div>
      ) : null}

      {tab === "access" ? (
        <div className="space-y-4">
          <Card className="space-y-4 rounded-2xl p-5">
            <div>
              <h2 className="text-sm font-semibold">Demo lock</h2>
              <p className="mt-1 text-sm text-muted">
                Your activation code lives on the server, not on the phone. Turn this on when you send someone a
                demo copy. You keep using the shop; they cannot run payroll until they enter the code.
              </p>
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={(s as { demoLocked?: boolean }).demoLocked === true}
                onChange={(e) => save({ demo_locked: e.target.checked })}
              />
              <span>Lock payroll and settings on demo copies</span>
            </label>
            <p className="text-xs text-muted">
              Activation code is set below (Unlock). Keep that code off the phones.
            </p>
          </Card>
          <Card className="space-y-4 rounded-2xl p-5">
            <div>
              <h2 className="text-sm font-semibold">Trial and license</h2>
              <p className="mt-1 text-sm text-muted">
                Without an activation code the hosted copy is a 7-day demo. Extend, shorten, or disable the trial
                here. The administrator PIN is stored on the server, not on the phone.
              </p>
            </div>
            {(() => {
              const trial = q.data?.profile.trial;
              if (!trial) return null;
              const label = trial.unlocked
                ? "Licensed"
                : !trial.enforced
                  ? "Preview — trial not enforced"
                  : trial.locked
                    ? "Locked"
                    : `${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left`;
              return (
                <p className="text-sm">
                  Status: <span className="font-medium text-fg">{label}</span>
                </p>
              );
            })()}
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">Trial days</span>
              <Input
                type="number"
                min={0}
                max={3650}
                value={v("trial_days", s.trialDays)}
                onChange={(e) => set("trial_days", e.target.value)}
                onBlur={() => save({ trial_days: Number(v("trial_days", s.trialDays)) })}
              />
            </label>
            {!q.data?.profile.trial.unlocked ? (
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <Input
                  value={unlockCode}
                  onChange={(e) => setUnlockCode(e.target.value)}
                  autoComplete="off"
                  placeholder="Unlock code"
                />
                <Button
                  type="button"
                  disabled={unlockMut.isPending || unlockCode.trim().length < 6}
                  onClick={() => unlockMut.mutate()}
                >
                  {unlockMut.isPending ? "Checking…" : "Unlock"}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted">This shop is unlocked. Payroll and field time stay available.</p>
            )}
          </Card>
          <Card className="space-y-4 rounded-2xl p-5">
            <div>
              <h2 className="text-sm font-semibold">Administrator access</h2>
              <p className="mt-1 text-sm text-muted">
                The Administrator button on sign-in requires this code. After unlock, that Google or email login
                is promoted to admin.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">Current code</span>
                <Input
                  type="password"
                  autoComplete="off"
                  value={currentCode}
                  onChange={(e) => setCurrentCode(e.target.value)}
                  placeholder={s.adminHintVisible ? "EDGE-ADMIN" : "Current code"}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">New code</span>
                <Input
                  type="password"
                  autoComplete="off"
                  value={nextCode}
                  onChange={(e) => setNextCode(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </label>
            </div>
            <Button
              type="button"
              disabled={codeMut.isPending || currentCode.trim().length < 6 || nextCode.trim().length < 6}
              onClick={() => codeMut.mutate({ data: { currentCode, nextCode } })}
            >
              {codeMut.isPending ? "Saving…" : "Change admin code"}
            </Button>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">Auto-admin emails</span>
              <textarea
                className="min-h-24 w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                value={emails ?? (emailsQ.data?.emails ?? s.adminEmails).join("\n")}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="you@gmail.com"
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              disabled={emailMut.isPending}
              onClick={() =>
                emailMut.mutate({
                  data: { emails: emails ?? (emailsQ.data?.emails ?? s.adminEmails).join("\n") },
                })
              }
            >
              Save admin emails
            </Button>
          </Card>
          <Card className="space-y-3 rounded-2xl p-5">
            <h2 className="text-sm font-semibold">Sign-in gate</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.signupOpen}
                onChange={(e) => save({ signup_open: e.target.checked })}
              />
              Allow new people to sign in
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.signupRequiresApproval}
                onChange={(e) => save({ signup_requires_approval: e.target.checked })}
              />
              Admin must approve new accounts
            </label>
          </Card>
        </div>
      ) : null}

      {tab === "backup" ? (
        <div className="space-y-4">
          <Card className="space-y-4 rounded-2xl p-5">
            <div>
              <h2 className="text-sm font-semibold">Local files</h2>
              <p className="mt-1 text-sm text-muted">
                Portable CSV + JSON for the current week: punches, payroll, assigned invoices, receipts. Keep a
                copy on the office computer.
              </p>
            </div>
            <Button disabled={exportMut.isPending} onClick={() => exportMut.mutate()}>
              {exportMut.isPending ? "Exporting…" : "Download week pack"}
            </Button>
          </Card>
          <Card className="space-y-4 rounded-2xl p-5">
            <div>
              <h2 className="text-sm font-semibold">Weekly hours email</h2>
              <p className="mt-1 text-sm text-muted">
                Copy a week of hours claims with ticket numbers and codes. SMTP is not on this host — paste into
                the shop mail client, or keep the address on file for the office Python window.
              </p>
            </div>
            <Field
              label="Send-to address"
              value={v("weekly_email_to", s.weeklyEmailTo)}
              onChange={(x) => set("weekly_email_to", x)}
              placeholder="owner@shop.com"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => save({ weekly_email_to: v("weekly_email_to", s.weeklyEmailTo) })}
              >
                Save address
              </Button>
              <Button
                variant="secondary"
                disabled={exportMut.isPending}
                onClick={() => exportMut.mutate()}
              >
                Copy week text
              </Button>
            </div>
          </Card>
          <Card className="space-y-4 rounded-2xl p-5">
            <div>
              <h2 className="text-sm font-semibold">Netlify deploy pack</h2>
              <p className="mt-1 text-sm text-muted">
                Source copy for a new Netlify site. After upload, set the environment values in
                {" "}
                <span className="font-mono text-fg">NETLIFY.txt</span>.
              </p>
            </div>
            <p className="text-sm">
              <a className="text-primary underline-offset-2 hover:underline" href="/office/field-ledger-netlify.zip" download>
                field-ledger-netlify.zip
              </a>
              <span className="text-muted"> — drop on Netlify or push to Git</span>
            </p>
            <p className="text-sm">
              <a className="text-primary underline-offset-2 hover:underline" href="/office/netlify.env" download>
                netlify.env
              </a>
              <span className="text-muted"> — import in Netlify environment (edit YOUR-SITE first)</span>
            </p>
            <p className="text-sm">
              <a className="text-primary underline-offset-2 hover:underline" href="/office/NETLIFY.txt" download>
                NETLIFY.txt
              </a>
              <span className="text-muted"> — build command, env vars, trial</span>
            </p>
          </Card>
          <Card className="space-y-4 rounded-2xl p-5">
            <div>
              <h2 className="text-sm font-semibold">Office computer sync</h2>
              <p className="mt-1 text-sm text-muted">
                Use the same Python window you already have for Maichle’s Edge. It serves the unzipped site to
                this computer and every phone on the shop Wi‑Fi, and handles <span className="font-mono text-fg">/api/sync</span>,
                <span className="font-mono text-fg"> /api/auth</span>, and <span className="font-mono text-fg">/api/push</span>.
                Copy <span className="font-mono text-fg">me_local_api.py</span> next to <span className="font-mono text-fg">index.html</span> if it is not already there.
                Google login will not work on that LAN address — that is expected. Maichle’s Edge uses the shop PIN there.
                Field Ledger on the hosted site uses work email.
              </p>
              <p className="mt-3 text-sm">
                <a className="text-primary underline-offset-2 hover:underline" href="/office/LOCAL_server_launcher_gui.py" download>
                  LOCAL_server_launcher_gui.py
                </a>
                <span className="text-muted"> — the window</span>
              </p>
              <p className="text-sm">
                <a className="text-primary underline-offset-2 hover:underline" href="/office/me_local_api.py" download>
                  me_local_api.py
                </a>
                <span className="text-muted"> — put this next to unzipped index.html</span>
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Office server URL"
                value={syncUrl ?? s.officeSyncUrl}
                onChange={setSyncUrl}
                placeholder="http://127.0.0.1:8080"
              />
              <Field
                label="Company sync key"
                value={syncKey ?? s.officeSyncKey}
                onChange={setSyncKey}
                placeholder="at least 6 characters"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                save({
                  office_sync_url: syncUrl ?? s.officeSyncUrl,
                  office_sync_key: syncKey ?? s.officeSyncKey,
                })
              }
            >
              Save sync target
            </Button>
          </Card>
          <Card className="space-y-2 text-sm text-muted rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-fg">Integration API</h2>
            <p>
              Independent of the primary platform. Send tickets in; receive time, GPS, exceptions, and validated
              hours. Header: <span className="font-mono text-fg">X-Field-Key</span>
            </p>
            <pre className="overflow-x-auto rounded-lg bg-elevated p-3 font-mono text-xs text-muted">
{`POST /api/integration/tickets
X-Field-Key: fld_demo_maichles_edge_2026

GET /api/sync   PUT /api/sync
POST /api/push  (subscribe | send | backup)
Header: x-sync-key`}
            </pre>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function PayConditionsEditor({
  value,
  onSave,
}: {
  value: PayConditions;
  onSave: (next: PayConditions) => void;
}) {
  const [next, setNext] = useState<PayConditions>(value);
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Pay conditions</h2>
        <p className="mt-1 text-xs text-muted">
          Not just on/off. For each payable status, decide whether GPS must match, whether a miss flags, and
          whether the weekly timecard needs approval.
        </p>
      </div>
      {PAID_KIND_OPTIONS.map((opt) => {
        const row = next[opt.id];
        return (
          <div key={opt.id} className="rounded-xl bg-elevated p-4">
            <p className="text-sm font-medium">{opt.label}</p>
            <p className="mb-2 text-xs text-muted">{opt.hint}</p>
            <label className="flex h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={row.requireGps}
                onChange={(e) =>
                  setNext((cur) => ({ ...cur, [opt.id]: { ...cur[opt.id], requireGps: e.target.checked } }))
                }
              />
              GPS must match this status
            </label>
            <label className="flex h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={row.flagOnFail}
                onChange={(e) =>
                  setNext((cur) => ({ ...cur, [opt.id]: { ...cur[opt.id], flagOnFail: e.target.checked } }))
                }
              />
              Auto-flag if GPS misses the window
            </label>
            <label className="flex h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={row.requireApproval}
                onChange={(e) =>
                  setNext((cur) => ({ ...cur, [opt.id]: { ...cur[opt.id], requireApproval: e.target.checked } }))
                }
              />
              Weekly timecard needs approval on a miss
            </label>
          </div>
        );
      })}
      <Button size="sm" onClick={() => onSave(next)}>
        Save pay conditions
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">{label}</span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function DockEditor({ value, onSave }: { value: NavId[]; onSave: (ids: NavId[]) => void }) {
  const [ids, setIds] = useState<NavId[]>(value);
  return (
    <div className="space-y-2">
      {NAV_CATALOG.map((item) => {
        const on = ids.includes(item.id);
        return (
          <label key={item.id} className="flex h-11 items-center gap-2 rounded-md px-2 hover:bg-elevated">
            <input
              type="checkbox"
              checked={on}
              onChange={() => {
                setIds((cur) => {
                  if (cur.includes(item.id)) return cur.filter((x) => x !== item.id);
                  if (cur.length >= 5) return cur;
                  return [...cur, item.id];
                });
              }}
            />
            <span className="text-sm">{item.label}</span>
            <span className="ml-auto text-xs text-subtle">{item.dockLabel}</span>
          </label>
        );
      })}
      <Button size="sm" onClick={() => onSave(ids.slice(0, 5))}>
        Save dock
      </Button>
    </div>
  );
}

function RoleNavEditor({
  value,
  onSave,
}: {
  value: Partial<Record<Role, NavId[]>>;
  onSave: (next: Partial<Record<Role, NavId[]>>) => void;
}) {
  const [next, setNext] = useState<Partial<Record<Role, NavId[]>>>(value);
  const roles: Role[] = ["technician", "manager", "admin"];
  return (
    <div className="space-y-4">
      {roles.map((role) => {
        const ids = next[role] ?? DEFAULT_ROLE_NAV[role];
        return (
          <div key={role}>
            <p className="mb-1 text-xs uppercase tracking-wide text-subtle">{role}</p>
            <div className="flex flex-wrap gap-2">
              {NAV_CATALOG.filter((n) => n.roles.includes(role)).map((n) => {
                const on = ids.includes(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() =>
                      setNext((cur) => {
                        const list = cur[role] ?? DEFAULT_ROLE_NAV[role];
                        const has = list.includes(n.id);
                        return { ...cur, [role]: has ? list.filter((x) => x !== n.id) : [...list, n.id] };
                      })
                    }
                    className={`h-9 rounded-md px-2 text-xs ${on ? "bg-primary text-primary-fg" : "bg-elevated text-muted"}`}
                  >
                    {n.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <Button size="sm" onClick={() => onSave(next)}>
        Save role screens
      </Button>
    </div>
  );
}
