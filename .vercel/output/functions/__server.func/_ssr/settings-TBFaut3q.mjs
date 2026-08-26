import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { c as THEMES, n as DEFAULT_PAY_CONDITIONS, o as NAV_CATALOG, r as DEFAULT_ROLE_NAV, s as PAID_KIND_OPTIONS, v as downloadText } from "./session.server-BThkfVCN.mjs";
import { t as Button } from "./button-DptnA-9j.mjs";
import { t as Input } from "./input-Cwgm8t2d.mjs";
import { t as Card } from "./card-CugKTQmh.mjs";
import { t as Spinner } from "./spinner-Bz_S9RQQ.mjs";
import { C as Check } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { f as saveSettings, o as getSettings } from "./api-ops-DOOYjFmA.mjs";
import { r as exportWeekPack } from "./api-account-C7rcPmzy.mjs";
import { l as setAdminAccessCode, o as redeemUnlockCode, r as getAdminEmails, s as saveAdminEmails } from "./api-admin-Cf7s1NH1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-TBFaut3q.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function projectMercator(lat, lng, zoom) {
	const scale = 256 * 2 ** zoom;
	const x = (lng + 180) / 360 * scale;
	const sin = Math.sin(lat * Math.PI / 180);
	return {
		x,
		y: (.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale
	};
}
function metersPerPixel(lat, zoom) {
	return 156543.03392 * Math.cos(lat * Math.PI / 180) / 2 ** zoom;
}
function RadiusCalibrator({ lat, lng, radiusFt, onChange, onUseHere, label = "Job-site radius" }) {
	const zoom = 16;
	const origin = (0, import_react.useMemo)(() => projectMercator(lat, lng, zoom), [lat, lng]);
	const tileX = Math.floor(origin.x / 256);
	const tileY = Math.floor(origin.y / 256);
	const mpp = metersPerPixel(lat, zoom);
	const radiusPx = radiusFt * .3048 / mpp;
	const size = 768;
	const center = {
		x: origin.x - (tileX - 1) * 256,
		y: origin.y - (tileY - 1) * 256
	};
	const [busy, setBusy] = (0, import_react.useState)(false);
	const tiles = [];
	for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) tiles.push({
		tx: tileX + dx,
		ty: tileY + dy
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-sm tabular",
					children: [Math.round(radiusFt), " ft"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative h-56 overflow-hidden rounded-xl bg-elevated",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
					style: {
						width: size,
						height: size
					},
					children: [
						tiles.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							alt: "",
							className: "absolute",
							style: {
								left: (t.tx - (tileX - 1)) * 256,
								top: (t.ty - (tileY - 1)) * 256,
								width: 256,
								height: 256
							},
							src: `https://tile.openstreetmap.org/${zoom}/${t.tx}/${t.ty}.png`
						}, `${t.tx}-${t.ty}`)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute rounded-full border-2 border-primary bg-primary/15",
							style: {
								width: radiusPx * 2,
								height: radiusPx * 2,
								left: center.x - radiusPx,
								top: center.y - radiusPx
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary",
							style: {
								left: center.x,
								top: center.y
							}
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "range",
				min: 50,
				max: 800,
				step: 10,
				value: radiusFt,
				onChange: (e) => onChange(Number(e.target.value)),
				className: "w-full accent-primary"
			}),
			onUseHere ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "secondary",
				size: "sm",
				disabled: busy,
				onClick: () => {
					if (!navigator.geolocation) return;
					setBusy(true);
					navigator.geolocation.getCurrentPosition((pos) => {
						onUseHere(pos.coords.latitude, pos.coords.longitude);
						setBusy(false);
					}, () => setBusy(false), {
						enableHighAccuracy: true,
						timeout: 2e4
					});
				},
				children: busy ? "Locating…" : "Center on this device"
			}) : null
		]
	});
}
var TABS = [
	{
		id: "pay",
		label: "Payable time",
		hint: "What GPS will pay"
	},
	{
		id: "office",
		label: "Shop address",
		hint: "Office geofence"
	},
	{
		id: "payroll",
		label: "Payroll",
		hint: "OT and tax"
	},
	{
		id: "look",
		label: "Appearance",
		hint: "Theme and nav"
	},
	{
		id: "sync",
		label: "Sync",
		hint: "Office computer"
	},
	{
		id: "access",
		label: "Access",
		hint: "Demo lock"
	},
	{
		id: "backup",
		label: "Backup",
		hint: "Files"
	}
];
function SettingsPage() {
	const qc = useQueryClient();
	const [tab, setTab] = (0, import_react.useState)("pay");
	const q = useQuery({
		queryKey: ["settings"],
		queryFn: () => getSettings()
	});
	const emailsQ = useQuery({
		queryKey: ["admin-emails"],
		queryFn: () => getAdminEmails(),
		enabled: q.data?.profile.employee.role === "admin"
	});
	const mut = useMutation({
		mutationFn: saveSettings,
		onSuccess: () => {
			toast.success("Saved");
			qc.invalidateQueries({ queryKey: ["settings"] });
			qc.invalidateQueries({ queryKey: ["profile"] });
			qc.invalidateQueries({ queryKey: ["dispatch"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const codeMut = useMutation({
		mutationFn: setAdminAccessCode,
		onSuccess: () => {
			toast.success("Administrator code updated");
			setCurrentCode("");
			setNextCode("");
			qc.invalidateQueries({ queryKey: ["admin-login-meta"] });
			qc.invalidateQueries({ queryKey: ["settings"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const emailMut = useMutation({
		mutationFn: saveAdminEmails,
		onSuccess: () => {
			toast.success("Admin emails saved");
			qc.invalidateQueries({ queryKey: ["admin-emails"] });
			qc.invalidateQueries({ queryKey: ["settings"] });
			qc.invalidateQueries({ queryKey: ["profile"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const exportMut = useMutation({
		mutationFn: () => exportWeekPack(),
		onSuccess: async (pack) => {
			downloadText(`timecards-${pack.from}.csv`, pack.csv.timecards, "text/csv");
			downloadText(`payroll-${pack.from}.csv`, pack.csv.payroll, "text/csv");
			downloadText(`jobs-${pack.from}.csv`, pack.csv.jobs, "text/csv");
			downloadText(`receipts-${pack.from}.csv`, pack.csv.receipts, "text/csv");
			downloadText(`field-ledger-${pack.from}.json`, JSON.stringify(pack.json, null, 2), "application/json");
			if (pack.emailBody) try {
				await navigator.clipboard.writeText(pack.emailBody);
				toast.success("Week files downloaded. Hours email copied to clipboard.");
			} catch {
				downloadText(`hours-email-${pack.from}.txt`, pack.emailBody, "text/plain");
				toast.success("Week files downloaded. Hours email saved as a text file.");
			}
			const url = (syncUrl || s?.officeSyncUrl || "").replace(/\/$/, "");
			const key = syncKey || s?.officeSyncKey || "";
			if (url && key) try {
				const res = await fetch(`${url}/api/sync`, {
					method: "PUT",
					headers: {
						"content-type": "application/json",
						"x-sync-key": key
					},
					body: JSON.stringify({
						rev: Date.now(),
						data: pack.json
					})
				});
				if (!res.ok) throw new Error(await res.text());
				toast.success("Week files downloaded and pushed to the office server");
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Office push failed — files still downloaded");
			}
			else if (!pack.emailBody) toast.success("Week files downloaded");
		},
		onError: (e) => toast.error(e.message)
	});
	const s = q.data?.profile.settings;
	const [draft, setDraft] = (0, import_react.useState)({});
	const [currentCode, setCurrentCode] = (0, import_react.useState)("");
	const [nextCode, setNextCode] = (0, import_react.useState)("");
	const [emails, setEmails] = (0, import_react.useState)();
	const [syncUrl, setSyncUrl] = (0, import_react.useState)();
	const [syncKey, setSyncKey] = (0, import_react.useState)();
	const [unlockCode, setUnlockCode] = (0, import_react.useState)("");
	const unlockMut = useMutation({
		mutationFn: () => redeemUnlockCode({ data: { code: unlockCode } }),
		onSuccess: () => {
			toast.success("Field Ledger is licensed for this shop");
			setUnlockCode("");
			qc.invalidateQueries({ queryKey: ["profile"] });
			qc.invalidateQueries({ queryKey: ["settings"] });
		},
		onError: (e) => toast.error(e.message)
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, { label: "Loading company rules…" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	if (!s) return null;
	if (q.data?.profile.employee.role !== "admin") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Administrator access required."
	});
	const v = (key, fallback) => draft[key] ?? String(fallback);
	const set = (key, value) => setDraft((d) => ({
		...d,
		[key]: value
	}));
	const save = (data) => mut.mutate({ data });
	const paid = new Set(s.paidKinds);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Company rules"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Control what field time the office will pay, confirm the shop geofence, and keep a portable backup."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 overflow-x-auto border-b border-border pb-px",
				children: TABS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab(t.id),
					className: `h-11 shrink-0 border-b-2 px-3 text-sm ${tab === t.id ? "border-primary text-fg" : "border-transparent text-muted"}`,
					children: t.label
				}, t.id))
			}),
			tab === "pay" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "space-y-5 rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: "Payable statuses"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "Technicians only get paid for the statuses you enable, and only when GPS agrees. Breaks and unmatched claims stay on the timecard as unpaid."
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-2 sm:grid-cols-2",
						children: PAID_KIND_OPTIONS.map((opt) => {
							const on = paid.has(opt.id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: `flex cursor-pointer items-start gap-3 rounded-xl p-4 shadow-[var(--shadow-border)] ${on ? "bg-elevated" : "bg-bg"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `mt-0.5 grid size-5 shrink-0 place-items-center rounded-sm ${on ? "bg-primary text-primary-fg" : "bg-elevated shadow-[var(--shadow-border)]"}`,
										children: on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" }) : null
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-sm font-medium",
										children: opt.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted",
										children: opt.hint
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										className: "sr-only",
										checked: on,
										onChange: () => {
											const next = new Set(paid);
											if (on) next.delete(opt.id);
											else next.add(opt.id);
											const kinds = PAID_KIND_OPTIONS.map((o) => o.id).filter((id) => next.has(id));
											save({ paid_kinds: JSON.stringify(kinds.length ? kinds : ["work"]) });
										}
									})
								]
							}, opt.id);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-start gap-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							className: "mt-1",
							checked: s.requireGpsForPay,
							onChange: (e) => save({ require_gps_for_pay: e.target.checked })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block font-medium",
							children: "Require GPS to pay (global default)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: "Per-status conditions below override this. A punch still posts instantly; GPS has the confirm window to catch up."
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-start gap-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							className: "mt-1",
							checked: s.paySoldHours,
							onChange: (e) => save({ pay_sold_hours: e.target.checked })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block font-medium",
							children: "Pay sold / code hours if finished early"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: "A 3-hour code completed in 2 hours still claims 3 sold hours. The tech is not penalized for being fast."
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-start gap-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							className: "mt-1",
							checked: s.gpsFailFlagsWork,
							onChange: (e) => save({ gps_fail_flags_work: e.target.checked })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block font-medium",
							children: "Working + GPS miss auto-flags the weekly timecard"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: "If GPS never matches the job during the confirm window, the associated tickets need approval."
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-2 block text-xs uppercase tracking-wide text-subtle",
							children: "GPS confirm window"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs text-muted",
							children: "Status hits the board immediately. GPS has this long to prove they are where the punch says."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-3 gap-2",
							children: [
								5,
								10,
								15
							].map((min) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => save({ gps_confirm_min: min }),
								className: `h-11 rounded-md text-sm ${Number(s.gpsConfirmMin) === min ? "bg-primary text-primary-fg" : "bg-elevated text-muted"}`,
								children: [min, " min"]
							}, min))
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayConditionsEditor, {
						value: s.payConditions ?? DEFAULT_PAY_CONDITIONS,
						onSave: (next) => save({ pay_conditions: JSON.stringify(next) })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-2 block text-xs uppercase tracking-wide text-subtle",
							children: "Efficiency alert"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs text-muted",
							children: "Sold hours ÷ available hours. Notify the owner when a tech drops below this live percentage."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-4 gap-2",
							children: [
								70,
								75,
								80,
								85
							].map((pct) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => save({ efficiency_alert_pct: pct }),
								className: `h-11 rounded-md text-sm ${Number(s.efficiencyAlertPct) === pct ? "bg-primary text-primary-fg" : "bg-elevated text-muted"}`,
								children: [pct, "%"]
							}, pct))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Custom %",
							value: v("efficiency_alert_pct", s.efficiencyAlertPct),
							onChange: (x) => set("efficiency_alert_pct", x)
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadiusCalibrator, {
						lat: Number(v("office_lat", s.officeLat)),
						lng: Number(v("office_lng", s.officeLng)),
						radiusFt: Number(v("gps_radius_ft", s.gpsRadiusFt)),
						label: "Job-site radius",
						onChange: (ft) => set("gps_radius_ft", String(ft))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Job-site radius (ft)",
							value: v("gps_radius_ft", s.gpsRadiusFt),
							onChange: (x) => set("gps_radius_ft", x)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Code vs time tolerance (min)",
							value: v("exception_tolerance_min", s.exceptionToleranceMin),
							onChange: (x) => set("exception_tolerance_min", x)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-2 block text-xs uppercase tracking-wide text-subtle",
							children: "GPS push interval"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs text-muted",
							children: "Phone stores the last point, then pushes it on this schedule. Separate from the confirm window above."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-4 gap-2",
							children: [
								{
									sec: 60,
									label: "1 min"
								},
								{
									sec: 300,
									label: "5 min"
								},
								{
									sec: 900,
									label: "15 min"
								},
								{
									sec: 1800,
									label: "30 min"
								}
							].map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => save({ gps_interval_sec: opt.sec }),
								className: `h-11 rounded-md text-sm ${Number(s.gpsIntervalSec) === opt.sec ? "bg-primary text-primary-fg" : "bg-elevated text-muted"}`,
								children: opt.label
							}, opt.sec))
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: s.travelCountsAsField,
							onChange: (e) => save({ travel_counts_as_field: e.target.checked })
						}), "Count in-transit toward field utilization"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: s.trackingOnlyDuringWork,
							onChange: (e) => save({ tracking_only_during_work: e.target.checked })
						}), "Track GPS only while clocked in"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-2 block text-xs uppercase tracking-wide text-subtle",
							children: "Available hours source (ST)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-2",
							children: ["schedule", "clock"].map((src) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => save({ efficiency_available_source: src }),
								className: `h-11 rounded-md text-sm ${s.efficiencyAvailableSource === src ? "bg-primary text-primary-fg" : "bg-elevated text-muted"}`,
								children: src === "schedule" ? "Scheduled week" : "Clocked hours"
							}, src))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-muted",
							children: "Billable efficiency = sold (code) hours ÷ this available pool — the ServiceTitan manager view."
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => save({
							gps_radius_ft: Number(v("gps_radius_ft", s.gpsRadiusFt)),
							exception_tolerance_min: Number(v("exception_tolerance_min", s.exceptionToleranceMin)),
							gps_interval_sec: Number(v("gps_interval_sec", s.gpsIntervalSec)),
							approaching_multiplier: Number(v("approaching_multiplier", s.approachingMultiplier)),
							gps_confirm_min: Number(v("gps_confirm_min", s.gpsConfirmMin)),
							efficiency_alert_pct: Number(v("efficiency_alert_pct", s.efficiencyAlertPct))
						}),
						children: "Save GPS rules"
					})
				]
			}) : null,
			tab === "office" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "space-y-4 rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: "Stock office / warehouse"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "Office allocation is only paid when the device is inside this geofence. Default is the New Castle shop."
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Name",
								value: v("office_name", s.officeName),
								onChange: (x) => set("office_name", x)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Street",
								value: v("office_address", s.officeAddress),
								onChange: (x) => set("office_address", x)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "City",
								value: v("office_city", s.officeCity),
								onChange: (x) => set("office_city", x)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "State",
								value: v("office_state", s.officeState),
								onChange: (x) => set("office_state", x)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "ZIP",
								value: v("office_zip", s.officeZip),
								onChange: (x) => set("office_zip", x)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Office radius (ft)",
								value: v("office_radius_ft", s.officeRadiusFt),
								onChange: (x) => set("office_radius_ft", x)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Latitude",
								value: v("office_lat", s.officeLat),
								onChange: (x) => set("office_lat", x)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Longitude",
								value: v("office_lng", s.officeLng),
								onChange: (x) => set("office_lng", x)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadiusCalibrator, {
						lat: Number(v("office_lat", s.officeLat)),
						lng: Number(v("office_lng", s.officeLng)),
						radiusFt: Number(v("office_radius_ft", s.officeRadiusFt)),
						label: "Shop geofence",
						onChange: (ft) => set("office_radius_ft", String(ft)),
						onUseHere: (lat, lng) => {
							set("office_lat", String(lat));
							set("office_lng", String(lng));
							save({
								office_lat: lat,
								office_lng: lng
							});
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "secondary",
							onClick: () => {
								if (!navigator.geolocation) {
									toast.error("This device has no GPS");
									return;
								}
								navigator.geolocation.getCurrentPosition((pos) => {
									save({
										office_lat: pos.coords.latitude,
										office_lng: pos.coords.longitude
									});
									toast.success("Shop pin set to this device");
								}, (err) => toast.error(err.message), {
									enableHighAccuracy: true,
									timeout: 2e4
								});
							},
							children: "I am at the shop — use this GPS"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => save({
								office_name: v("office_name", s.officeName),
								office_address: v("office_address", s.officeAddress),
								office_city: v("office_city", s.officeCity),
								office_state: v("office_state", s.officeState),
								office_zip: v("office_zip", s.officeZip),
								office_radius_ft: Number(v("office_radius_ft", s.officeRadiusFt)),
								office_lat: Number(v("office_lat", s.officeLat)),
								office_lng: Number(v("office_lng", s.officeLng))
							}),
							children: "Save shop address"
						})]
					})
				]
			}) : null,
			tab === "payroll" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "space-y-4 rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: "Wage estimate"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "Weekly overtime, default labor sell rate, plumbing parts markup, and withholding used on the payroll screen. Historical wage rows are never overwritten."
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Weekly OT after (hours)",
								value: v("overtime_weekly_hours", s.overtimeWeeklyHours),
								onChange: (x) => set("overtime_weekly_hours", x)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "OT multiplier",
								value: v("overtime_multiplier", s.overtimeMultiplier),
								onChange: (x) => set("overtime_multiplier", x)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Labor sell rate",
								value: v("labor_rate", s.laborRate),
								onChange: (x) => set("labor_rate", x)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Parts markup (×)",
								value: v("parts_markup", s.partsMarkup),
								onChange: (x) => set("parts_markup", x)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Federal withholding %",
								value: v("payroll_fed_pct", s.payrollFedPct),
								onChange: (x) => set("payroll_fed_pct", x)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "DE state %",
								value: v("payroll_state_pct", s.payrollStatePct),
								onChange: (x) => set("payroll_state_pct", x)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "FICA %",
								value: v("payroll_fica_pct", s.payrollFicaPct),
								onChange: (x) => set("payroll_fica_pct", x)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: s.doubleTimeEnabled,
							onChange: (e) => save({ double_time_enabled: e.target.checked })
						}), "Double-time after 4 overtime hours"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => save({
							overtime_weekly_hours: Number(v("overtime_weekly_hours", s.overtimeWeeklyHours)),
							overtime_multiplier: Number(v("overtime_multiplier", s.overtimeMultiplier)),
							labor_rate: Number(v("labor_rate", s.laborRate)),
							parts_markup: Number(v("parts_markup", s.partsMarkup)),
							payroll_fed_pct: Number(v("payroll_fed_pct", s.payrollFedPct)),
							payroll_state_pct: Number(v("payroll_state_pct", s.payrollStatePct)),
							payroll_fica_pct: Number(v("payroll_fica_pct", s.payrollFicaPct))
						}),
						children: "Save payroll rules"
					})
				]
			}) : null,
			tab === "sync" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "space-y-4 rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: "Office computer sync"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "Phones keep GPS locally and push on the interval above. The office Python window receives the same company blob the hosted site writes here."
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Office server URL",
							value: syncUrl ?? s.officeSyncUrl,
							onChange: setSyncUrl,
							placeholder: "http://192.168.x.x:8080"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Company sync key",
							value: syncKey ?? s.officeSyncKey,
							onChange: setSyncKey,
							placeholder: "at least 6 characters"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => save({
							office_sync_url: syncUrl ?? s.officeSyncUrl,
							office_sync_key: syncKey ?? s.officeSyncKey,
							setup_complete: true
						}),
						children: "Save sync"
					})
				]
			}) : null,
			tab === "look" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "space-y-3 rounded-2xl p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold",
								children: "Shop theme"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: "One look for the whole office. Only the administrator account changes this — it is not per technician."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
								children: THEMES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => save({ theme_id: t.id }),
									className: `rounded-xl px-3 py-3 text-left shadow-[var(--shadow-border)] ${s.themeId === t.id ? "bg-primary text-primary-fg" : "bg-elevated text-fg"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-sm font-medium",
										children: t.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `text-xs ${s.themeId === t.id ? "text-primary-fg/80" : "text-muted"}`,
										children: t.hint
									})]
								}, t.id))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "space-y-3 rounded-2xl p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold",
								children: "Computer vs phone"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-3 gap-2",
								children: [
									"auto",
									"desktop",
									"mobile"
								].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => save({ layout_mode: m }),
									className: `h-11 rounded-md text-sm capitalize ${s.layoutMode === m ? "bg-primary text-primary-fg" : "bg-elevated text-muted"}`,
									children: m === "auto" ? "Auto" : m === "desktop" ? "Computer" : "Phone"
								}, m))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: s.dispatchShowMap,
									onChange: (e) => save({ dispatch_show_map: e.target.checked })
								}), "Live map on the computer dispatch board"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: s.dispatchShowTiles,
									onChange: (e) => save({ dispatch_show_tiles: e.target.checked })
								}), "KPI tiles above the computer board"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "space-y-3 rounded-2xl p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold",
								children: "Phone dock"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: "Technicians use the five tabs below. Supervisors default to Board, Flags, Eff, Jobs, Hours. Administrators default to Board, Flags, Eff, People, Setup."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DockEditor, {
								value: s.mobileDock,
								onSave: (ids) => save({ mobile_dock: JSON.stringify(ids) })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "space-y-3 rounded-2xl p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-semibold",
							children: "Role screens"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleNavEditor, {
							value: s.roleNav,
							onSave: (next) => save({ role_nav: JSON.stringify(next) })
						})]
					})
				]
			}) : null,
			tab === "access" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "space-y-4 rounded-2xl p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold",
								children: "Demo lock"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: "Your activation code lives on the server, not on the phone. Turn this on when you send someone a demo copy. You keep using the shop; they cannot run payroll until they enter the code."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-start gap-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									className: "mt-1",
									checked: s.demoLocked === true,
									onChange: (e) => save({ demo_locked: e.target.checked })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Lock payroll and settings on demo copies" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: "Activation code is set below (Unlock). Keep that code off the phones."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "space-y-4 rounded-2xl p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold",
								children: "Trial and license"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: "Without an activation code the hosted copy is a 7-day demo. Extend, shorten, or disable the trial here. The administrator PIN is stored on the server, not on the phone."
							})] }),
							(() => {
								const trial = q.data?.profile.trial;
								if (!trial) return null;
								const label = trial.unlocked ? "Licensed" : !trial.enforced ? "Preview — trial not enforced" : trial.locked ? "Locked" : `${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left`;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm",
									children: ["Status: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium text-fg",
										children: label
									})]
								});
							})(),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1 block text-xs uppercase tracking-wide text-subtle",
									children: "Trial days"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									min: 0,
									max: 3650,
									value: v("trial_days", s.trialDays),
									onChange: (e) => set("trial_days", e.target.value),
									onBlur: () => save({ trial_days: Number(v("trial_days", s.trialDays)) })
								})]
							}),
							!q.data?.profile.trial.unlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 sm:grid-cols-[1fr_auto]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: unlockCode,
									onChange: (e) => setUnlockCode(e.target.value),
									autoComplete: "off",
									placeholder: "Unlock code"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									disabled: unlockMut.isPending || unlockCode.trim().length < 6,
									onClick: () => unlockMut.mutate(),
									children: unlockMut.isPending ? "Checking…" : "Unlock"
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "This shop is unlocked. Payroll and field time stay available."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "space-y-4 rounded-2xl p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold",
								children: "Administrator access"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: "The Administrator button on sign-in requires this code. After unlock, that Google or email login is promoted to admin."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mb-1 block text-xs uppercase tracking-wide text-subtle",
										children: "Current code"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "password",
										autoComplete: "off",
										value: currentCode,
										onChange: (e) => setCurrentCode(e.target.value),
										placeholder: s.adminHintVisible ? "EDGE-ADMIN" : "Current code"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mb-1 block text-xs uppercase tracking-wide text-subtle",
										children: "New code"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "password",
										autoComplete: "off",
										value: nextCode,
										onChange: (e) => setNextCode(e.target.value),
										placeholder: "At least 6 characters"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								disabled: codeMut.isPending || currentCode.trim().length < 6 || nextCode.trim().length < 6,
								onClick: () => codeMut.mutate({ data: {
									currentCode,
									nextCode
								} }),
								children: codeMut.isPending ? "Saving…" : "Change admin code"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1 block text-xs uppercase tracking-wide text-subtle",
									children: "Auto-admin emails"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									className: "min-h-24 w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
									value: emails ?? (emailsQ.data?.emails ?? s.adminEmails).join("\n"),
									onChange: (e) => setEmails(e.target.value),
									placeholder: "you@gmail.com"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "secondary",
								disabled: emailMut.isPending,
								onClick: () => emailMut.mutate({ data: { emails: emails ?? (emailsQ.data?.emails ?? s.adminEmails).join("\n") } }),
								children: "Save admin emails"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "space-y-3 rounded-2xl p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold",
								children: "Sign-in gate"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: s.signupOpen,
									onChange: (e) => save({ signup_open: e.target.checked })
								}), "Allow new people to sign in"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: s.signupRequiresApproval,
									onChange: (e) => save({ signup_requires_approval: e.target.checked })
								}), "Admin must approve new accounts"]
							})
						]
					})
				]
			}) : null,
			tab === "backup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "space-y-4 rounded-2xl p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-semibold",
							children: "Local files"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "Portable CSV + JSON for the current week: punches, payroll, assigned invoices, receipts. Keep a copy on the office computer."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							disabled: exportMut.isPending,
							onClick: () => exportMut.mutate(),
							children: exportMut.isPending ? "Exporting…" : "Download week pack"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "space-y-4 rounded-2xl p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold",
								children: "Weekly hours email"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: "Copy a week of hours claims with ticket numbers and codes. SMTP is not on this host — paste into the shop mail client, or keep the address on file for the office Python window."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Send-to address",
								value: v("weekly_email_to", s.weeklyEmailTo),
								onChange: (x) => set("weekly_email_to", x),
								placeholder: "owner@shop.com"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									onClick: () => save({ weekly_email_to: v("weekly_email_to", s.weeklyEmailTo) }),
									children: "Save address"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									disabled: exportMut.isPending,
									onClick: () => exportMut.mutate(),
									children: "Copy week text"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "space-y-4 rounded-2xl p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold",
								children: "Netlify deploy pack"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-sm text-muted",
								children: [
									"Source copy for a new Netlify site. After upload, set the environment values in",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-fg",
										children: "NETLIFY.txt"
									}),
									"."
								]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									className: "text-primary underline-offset-2 hover:underline",
									href: "/office/field-ledger-netlify.zip",
									download: true,
									children: "field-ledger-netlify.zip"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: " — drop on Netlify or push to Git"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									className: "text-primary underline-offset-2 hover:underline",
									href: "/office/netlify.env",
									download: true,
									children: "netlify.env"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: " — import in Netlify environment (edit YOUR-SITE first)"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									className: "text-primary underline-offset-2 hover:underline",
									href: "/office/NETLIFY.txt",
									download: true,
									children: "NETLIFY.txt"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: " — build command, env vars, trial"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "space-y-4 rounded-2xl p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-semibold",
									children: "Office computer sync"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-sm text-muted",
									children: [
										"Use the same Python window you already have for Maichle’s Edge. It serves the unzipped site to this computer and every phone on the shop Wi‑Fi, and handles ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-fg",
											children: "/api/sync"
										}),
										",",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-fg",
											children: " /api/auth"
										}),
										", and ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-fg",
											children: "/api/push"
										}),
										". Copy ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-fg",
											children: "me_local_api.py"
										}),
										" next to ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-fg",
											children: "index.html"
										}),
										" if it is not already there. Google login will not work on that LAN address — that is expected. Maichle’s Edge uses the shop PIN there. Field Ledger on the hosted site uses work email."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-3 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-primary underline-offset-2 hover:underline",
										href: "/office/LOCAL_server_launcher_gui.py",
										download: true,
										children: "LOCAL_server_launcher_gui.py"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: " — the window"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-primary underline-offset-2 hover:underline",
										href: "/office/me_local_api.py",
										download: true,
										children: "me_local_api.py"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: " — put this next to unzipped index.html"
									})]
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Office server URL",
									value: syncUrl ?? s.officeSyncUrl,
									onChange: setSyncUrl,
									placeholder: "http://127.0.0.1:8080"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Company sync key",
									value: syncKey ?? s.officeSyncKey,
									onChange: setSyncKey,
									placeholder: "at least 6 characters"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: () => save({
									office_sync_url: syncUrl ?? s.officeSyncUrl,
									office_sync_key: syncKey ?? s.officeSyncKey
								}),
								children: "Save sync target"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "space-y-2 text-sm text-muted rounded-2xl p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold text-fg",
								children: "Integration API"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Independent of the primary platform. Send tickets in; receive time, GPS, exceptions, and validated hours. Header: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-fg",
								children: "X-Field-Key"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
								className: "overflow-x-auto rounded-lg bg-elevated p-3 font-mono text-xs text-muted",
								children: `POST /api/integration/tickets
X-Field-Key: fld_demo_maichles_edge_2026

GET /api/sync   PUT /api/sync
POST /api/push  (subscribe | send | backup)
Header: x-sync-key`
							})
						]
					})
				]
			}) : null
		]
	});
}
function PayConditionsEditor({ value, onSave }) {
	const [next, setNext] = (0, import_react.useState)(value);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-semibold",
				children: "Pay conditions"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: "Not just on/off. For each payable status, decide whether GPS must match, whether a miss flags, and whether the weekly timecard needs approval."
			})] }),
			PAID_KIND_OPTIONS.map((opt) => {
				const row = next[opt.id];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-elevated p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: opt.label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs text-muted",
							children: opt.hint
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex h-11 items-center gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: row.requireGps,
								onChange: (e) => setNext((cur) => ({
									...cur,
									[opt.id]: {
										...cur[opt.id],
										requireGps: e.target.checked
									}
								}))
							}), "GPS must match this status"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex h-11 items-center gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: row.flagOnFail,
								onChange: (e) => setNext((cur) => ({
									...cur,
									[opt.id]: {
										...cur[opt.id],
										flagOnFail: e.target.checked
									}
								}))
							}), "Auto-flag if GPS misses the window"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex h-11 items-center gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: row.requireApproval,
								onChange: (e) => setNext((cur) => ({
									...cur,
									[opt.id]: {
										...cur[opt.id],
										requireApproval: e.target.checked
									}
								}))
							}), "Weekly timecard needs approval on a miss"]
						})
					]
				}, opt.id);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				onClick: () => onSave(next),
				children: "Save pay conditions"
			})
		]
	});
}
function Field({ label, value, onChange, placeholder }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1 block text-xs uppercase tracking-wide text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			value,
			onChange: (e) => onChange(e.target.value),
			placeholder
		})]
	});
}
function DockEditor({ value, onSave }) {
	const [ids, setIds] = (0, import_react.useState)(value);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [NAV_CATALOG.map((item) => {
			const on = ids.includes(item.id);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex h-11 items-center gap-2 rounded-md px-2 hover:bg-elevated",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: on,
						onChange: () => {
							setIds((cur) => {
								if (cur.includes(item.id)) return cur.filter((x) => x !== item.id);
								if (cur.length >= 5) return cur;
								return [...cur, item.id];
							});
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm",
						children: item.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-auto text-xs text-subtle",
						children: item.dockLabel
					})
				]
			}, item.id);
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			size: "sm",
			onClick: () => onSave(ids.slice(0, 5)),
			children: "Save dock"
		})]
	});
}
function RoleNavEditor({ value, onSave }) {
	const [next, setNext] = (0, import_react.useState)(value);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [[
			"technician",
			"manager",
			"admin"
		].map((role) => {
			const ids = next[role] ?? DEFAULT_ROLE_NAV[role];
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-1 text-xs uppercase tracking-wide text-subtle",
				children: role
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: NAV_CATALOG.filter((n) => n.roles.includes(role)).map((n) => {
					const on = ids.includes(n.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setNext((cur) => {
							const list = cur[role] ?? DEFAULT_ROLE_NAV[role];
							const has = list.includes(n.id);
							return {
								...cur,
								[role]: has ? list.filter((x) => x !== n.id) : [...list, n.id]
							};
						}),
						className: `h-9 rounded-md px-2 text-xs ${on ? "bg-primary text-primary-fg" : "bg-elevated text-muted"}`,
						children: n.label
					}, n.id);
				})
			})] }, role);
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			size: "sm",
			onClick: () => onSave(next),
			children: "Save role screens"
		})]
	});
}
//#endregion
export { SettingsPage as component };
