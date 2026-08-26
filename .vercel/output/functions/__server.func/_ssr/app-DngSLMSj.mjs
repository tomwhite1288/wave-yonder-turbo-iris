import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as Navigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { A as initials, G as todayIso, S as formatClock, h as cn } from "./session.server-BThkfVCN.mjs";
import { t as GPS_LABEL } from "./queries.server-CkA3omDT.mjs";
import { t as Button } from "./button-DptnA-9j.mjs";
import { t as Input } from "./input-Cwgm8t2d.mjs";
import { t as Card } from "./card-CugKTQmh.mjs";
import { t as Spinner } from "./spinner-Bz_S9RQQ.mjs";
import { n as GpsBadge } from "./status-CK2L7Kdp.mjs";
import { i as getSessionProfile } from "./api-CRRtNY9Y.mjs";
import { n as createWorkOrder, r as getDispatchDesk, t as assignWorkOrder } from "./api-dispatch-DPRVE5QJ.mjs";
import { S as ChevronLeft, f as Plus, x as ChevronRight } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-DngSLMSj.js
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
function LiveMap({ rows, officeLat, officeLng, compact }) {
	const pins = rows.filter((r) => r.lastLat != null && r.lastLng != null);
	const centerLat = pins[0]?.lastLat ?? officeLat ?? 39.662;
	const centerLng = pins[0]?.lastLng ?? officeLng ?? -75.566;
	const zoom = pins.length > 1 ? 11 : 13;
	const origin = projectMercator(centerLat, centerLng, zoom);
	const tileX = Math.floor(origin.x / 256);
	const tileY = Math.floor(origin.y / 256);
	const tiles = [];
	for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) tiles.push({
		tx: tileX + dx,
		ty: tileY + dy
	});
	const width = 768;
	const height = 768;
	origin.x - (tileX - 1) * 256, origin.y - (tileY - 1) * 256;
	function pinStyle(lat, lng) {
		const p = projectMercator(lat, lng, zoom);
		return {
			left: p.x - (tileX - 1) * 256,
			top: p.y - (tileY - 1) * 256
		};
	}
	const DOT = {
		WORKING: "bg-ok",
		ON_SITE: "bg-ok",
		AT_OFFICE: "bg-info",
		APPROACHING: "bg-warn",
		LEFT_SITE: "bg-danger",
		OFF_SITE: "bg-danger",
		OFFLINE: "bg-subtle"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex h-full min-h-56 flex-col", compact && "min-h-0"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between border-b border-border px-3 py-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold",
				children: "Live map"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] uppercase tracking-wide text-muted",
				children: pins.length ? `${pins.length} GPS live` : "Waiting for a GPS ping"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative min-h-52 flex-1 overflow-hidden bg-elevated",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
					style: {
						width,
						height
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
						officeLat != null && officeLng != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute z-10 -translate-x-1/2 -translate-y-1/2",
							style: pinStyle(officeLat, officeLng),
							title: "Shop",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-3 rounded-full bg-primary ring-4 ring-primary/30" })
						}) : null,
						pins.map((row) => {
							const pos = pinStyle(row.lastLat, row.lastLng);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute z-20 -translate-x-1/2 -translate-y-1/2",
								style: pos,
								title: `${row.employee.name} · ${GPS_LABEL[row.gpsStatus]}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cn("grid size-8 place-items-center rounded-full text-[10px] font-semibold text-primary-fg shadow-[var(--shadow-border)]", DOT[row.gpsStatus] || "bg-primary"),
									children: initials(row.employee.name)
								})
							}, row.employee.id);
						})
					]
				}),
				pins.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "absolute inset-x-4 bottom-3 z-30 text-center text-xs text-muted",
					children: "Open Today, allow location, tap Confirm GPS. Pins stay on this map."
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "absolute bottom-1 right-2 z-30 text-[10px] text-subtle",
					children: "© OpenStreetMap"
				})
			]
		})]
	});
}
function addDays(iso, days) {
	const d = /* @__PURE__ */ new Date(`${iso}T12:00:00-04:00`);
	d.setDate(d.getDate() + days);
	return d.toISOString().slice(0, 10);
}
function hoursFor(span) {
	if (span === "shift") return range(7, 17);
	return range(6, 20);
}
function range(start, end) {
	const out = [];
	for (let h = start; h < end; h += 1) out.push(h);
	return out;
}
function labelHour(h) {
	const am = h < 12;
	return `${h % 12 === 0 ? 12 : h % 12}${am ? "a" : "p"}`;
}
function stampOn(dateIso, hour) {
	return `${dateIso}T${String(Math.floor(hour)).padStart(2, "0")}:${String(Math.round(hour % 1 * 60)).padStart(2, "0")}:00-04:00`;
}
function hourOf(iso, fallback) {
	if (!iso) return fallback;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return fallback;
	return d.getHours() + d.getMinutes() / 60;
}
function DispatchBoard() {
	const qc = useQueryClient();
	const desk = useQuery({
		queryKey: ["dispatch"],
		queryFn: () => getDispatchDesk(),
		refetchInterval: 8e3
	});
	const [span, setSpan] = (0, import_react.useState)("shift");
	const [date, setDate] = (0, import_react.useState)(() => todayIso());
	const [tab, setTab] = (0, import_react.useState)("unassigned");
	const [q, setQ] = (0, import_react.useState)("");
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const assign = useMutation({
		mutationFn: assignWorkOrder,
		onSuccess: () => {
			toast.success("Assigned");
			qc.invalidateQueries({ queryKey: ["dispatch"] });
			qc.invalidateQueries({ queryKey: ["jobs"] });
		},
		onError: (e) => toast.error(e.message)
	});
	if (desk.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, { label: "Opening dispatch board…" });
	if (desk.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: desk.error.message
	});
	const data = desk.data;
	const tz = data.profile.settings.timezone;
	const hours = hoursFor(span);
	const startH = hours[0] ?? 7;
	const endH = (hours[hours.length - 1] ?? 16) + 1;
	const techs = data.people;
	const liveBy = new Map(data.rows.map((r) => [r.employee.id, r]));
	const weekDates = [
		0,
		1,
		2,
		3,
		4,
		5,
		6
	].map((i) => addDays(date, i - (/* @__PURE__ */ new Date(`${date}T12:00:00-04:00`)).getDay()));
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
		return `${t.ticketNumber} ${t.customerName} ${t.addressLine} ${t.workDetail ?? ""}`.toLowerCase().includes(q.trim().toLowerCase());
	});
	function dropOn(techId, ev, hour) {
		ev.preventDefault();
		const id = ev.dataTransfer.getData("text/job-id");
		if (!id) return;
		assign.mutate({ data: {
			ticketId: id,
			technicianId: techId,
			appointmentStart: stampOn(date, hour ?? startH + 1)
		} });
	}
	const working = data.rows.filter((r) => r.clockedIn || r.gpsStatus === "WORKING").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mr-auto text-lg font-semibold tracking-tight",
						children: "Dispatch Board"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex rounded-md bg-surface shadow-[var(--shadow-border)]",
						children: [
							"shift",
							"day",
							"week"
						].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setSpan(s),
							className: cn("h-9 px-3 text-xs font-medium capitalize", span === s ? "bg-primary text-primary-fg" : "text-muted"),
							children: s === "day" ? "Full Day" : s === "shift" ? "Shift" : "Week"
						}, s))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "secondary",
								onClick: () => setDate(addDays(date, span === "week" ? -7 : -1)),
								"aria-label": "Previous",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "min-w-40 text-center text-sm font-medium",
								children: span === "week" ? `Week of ${weekDates[0]}` : date
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "secondary",
								onClick: () => setDate(addDays(date, span === "week" ? 7 : 1)),
								"aria-label": "Next",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "secondary",
								onClick: () => setDate(todayIso()),
								children: "Today"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						onClick: () => setCreateOpen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Create Work Order"]
					})
				]
			}),
			data.profile.settings.dispatchShowTiles ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Technicians",
						value: String(techs.length)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Working",
						value: String(working)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Open jobs",
						value: String(data.tickets.filter((t) => t.status !== "complete").length)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Exceptions",
						value: String(data.openExceptions)
					})
				]
			}) : null,
			span === "week" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeekGrid, {
				techs,
				days: weekDates,
				jobs: data.tickets,
				liveBy,
				onDrop: dropOn
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 overflow-auto rounded-lg bg-surface shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-[720px] pb-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid border-b border-border text-[11px] font-medium uppercase tracking-wide text-muted",
							style: { gridTemplateColumns: `11rem repeat(${hours.length}, minmax(4.5rem, 1fr))` },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "px-3 py-2",
								children: "Technicians"
							}), hours.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "border-l border-border px-1 py-2 text-center",
								children: labelHour(h)
							}, h))]
						}),
						techs.map((tech, i) => {
							const live = liveBy.get(tech.id);
							const mine = jobs.filter((t) => t.technicianId === tech.id && t.status !== "complete");
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TechRow, {
								name: tech.name,
								title: `${tech.department}${live ? ` · ${live.gpsStatus.replace("_", " ")}` : ""}`,
								online: Boolean(live?.clockedIn),
								ago: live?.lastGpsAt ? formatClock(live.lastGpsAt, tz) : "No GPS",
								hours,
								jobs: mine,
								startH,
								endH,
								stripe: i % 2 === 1,
								nowPct: date === todayIso() ? ((/* @__PURE__ */ new Date()).getHours() + (/* @__PURE__ */ new Date()).getMinutes() / 60 - startH) / (endH - startH) * 100 : null,
								onDragOver: (e) => e.preventDefault(),
								onDrop: (e) => {
									const box = e.currentTarget.getBoundingClientRect();
									const x = e.clientX - box.left - 176;
									const pct = Math.max(0, x) / Math.max(1, box.width - 176);
									dropOn(tech.id, e, startH + pct * (endH - startH));
								}
							}, tech.id);
						}),
						techs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-3 py-8 text-sm text-muted",
							children: "No technicians on the roster yet."
						}) : null
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("grid shrink-0 gap-3", data.profile.settings.dispatchShowMap ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]" : ""),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex min-h-56 flex-col overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2 border-b border-border px-3 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mr-auto text-sm font-semibold",
								children: "Work Orders"
							}),
							[
								"unassigned",
								"assigned",
								"completed"
							].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setTab(t),
								className: cn("h-8 rounded-md px-2.5 text-xs font-medium capitalize", tab === t ? "bg-primary text-primary-fg" : "text-muted hover:bg-elevated"),
								children: t
							}, t)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: q,
								onChange: (e) => setQ(e.target.value),
								placeholder: "Search customer, ID, address",
								className: "h-8 w-48"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-h-0 flex-1 overflow-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full text-left text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "sticky top-0 bg-surface text-[10px] uppercase tracking-wide text-muted",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2 font-medium",
										children: "ID"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2 font-medium",
										children: "Customer"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "hidden px-3 py-2 font-medium sm:table-cell",
										children: "Address"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2 font-medium",
										children: "When"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "hidden px-3 py-2 font-medium md:table-cell",
										children: "Task"
									})
								] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 5,
								className: "px-3 py-8 text-center text-muted",
								children: "Nothing in this list. Create a work order or import tickets."
							}) }) : list.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								draggable: true,
								onDragStart: (e) => {
									e.dataTransfer.setData("text/job-id", t.id);
									e.dataTransfer.effectAllowed = "move";
								},
								className: "cursor-grab border-t border-border hover:bg-elevated",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 font-mono text-xs",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/app/jobs/$ticketId",
											params: { ticketId: t.id },
											className: "text-primary hover:underline",
											children: ["#", t.ticketNumber]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: t.customerName
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "hidden px-3 py-2 text-muted sm:table-cell",
										children: t.addressLine
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 tabular-nums text-muted",
										children: t.scheduledStart ? formatClock(t.scheduledStart, tz) : "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "hidden max-w-48 truncate px-3 py-2 text-muted md:table-cell",
										children: t.workDetail || t.technicianName || "—"
									})
								]
							}, t.id)) })]
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "min-h-56 overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-border)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveMap, {
						rows: data.rows,
						officeLat: data.profile.settings.officeLat,
						officeLng: data.profile.settings.officeLng,
						compact: true
					})
				})]
			}),
			createOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateOrder, {
				techs,
				date,
				onClose: () => setCreateOpen(false),
				onCreated: (assigned) => {
					setCreateOpen(false);
					if (assigned) setTab("assigned");
					qc.invalidateQueries({ queryKey: ["dispatch"] });
				}
			}) : null
		]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xl font-semibold tabular",
			children: value
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs uppercase tracking-wide text-subtle",
			children: label
		})]
	});
}
function TechRow({ name, title, online, ago, hours, jobs, startH, endH, stripe, nowPct, onDragOver, onDrop }) {
	const span = endH - startH;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("relative grid border-b border-border", stripe && "bg-elevated/40"),
		style: {
			gridTemplateColumns: `11rem repeat(${hours.length}, minmax(4.5rem, 1fr))`,
			minHeight: "4.75rem"
		},
		onDragOver,
		onDrop,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 px-3 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-8 shrink-0 place-items-center rounded-full bg-elevated text-[11px] font-semibold",
						children: initials(name)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm font-medium",
							children: name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-[10px] text-muted",
							children: [
								title,
								" · ",
								ago
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("ml-auto size-2 shrink-0 rounded-full", online ? "bg-ok" : "bg-border") })
				]
			}),
			hours.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-l border-border" }, h)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-y-0 overflow-visible",
				style: {
					left: "11rem",
					right: 0
				},
				children: [nowPct != null && nowPct >= 0 && nowPct <= 100 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-y-0 w-px bg-primary/70",
					style: { left: `${nowPct}%` }
				}) : null, jobs.map((t) => {
					const a = hourOf(t.scheduledStart, startH + 1);
					const b = hourOf(t.scheduledEnd, a + Math.max(1, t.expectedHours || 1.5));
					const left = (a - startH) / span * 100;
					const width = Math.max(8, (b - a) / span * 100);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/app/jobs/$ticketId",
						params: { ticketId: t.id },
						className: "pointer-events-auto absolute top-3 h-8 overflow-hidden rounded-md bg-primary/20 px-2 text-[11px] font-medium text-fg",
						style: {
							left: `${Math.max(0, left)}%`,
							width: `${Math.min(100 - Math.max(0, left), width)}%`
						},
						children: [
							"#",
							t.ticketNumber,
							" ",
							t.customerName
						]
					}, t.id);
				})]
			})
		]
	});
}
function WeekGrid({ techs, days, jobs, liveBy, onDrop }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-auto rounded-lg bg-surface shadow-[var(--shadow-border)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "min-w-[860px] w-full text-left text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "text-[11px] uppercase tracking-wide text-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2",
						children: "Tech"
					}), days.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2",
						children: d.slice(5)
					}, d))]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: techs.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-b border-border/70",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
					className: "px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-medium",
						children: t.name
					}), liveBy.get(t.id) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GpsBadge, { status: liveBy.get(t.id).gpsStatus }) : null]
				}), days.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "px-2 py-2 align-top",
					onDragOver: (e) => e.preventDefault(),
					onDrop: (e) => onDrop(t.id, e),
					children: jobs.filter((j) => j.technicianId === t.id && j.scheduledStart?.slice(0, 10) === d).map((j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-1 rounded-md bg-elevated px-2 py-1 text-[11px]",
						children: [
							"#",
							j.ticketNumber,
							" ",
							j.customerName
						]
					}, j.id))
				}, d))]
			}, t.id)) })]
		})
	});
}
function CreateOrder({ techs, date, onClose, onCreated }) {
	const [customer, setCustomer] = (0, import_react.useState)("");
	const [address, setAddress] = (0, import_react.useState)("");
	const [city, setCity] = (0, import_react.useState)("New Castle");
	const [ticket, setTicket] = (0, import_react.useState)("");
	const [task, setTask] = (0, import_react.useState)("");
	const [tech, setTech] = (0, import_react.useState)("");
	const [start, setStart] = (0, import_react.useState)("08:00");
	const [jobKind, setJobKind] = (0, import_react.useState)("service");
	const mut = useMutation({
		mutationFn: createWorkOrder,
		onSuccess: (res) => {
			toast.success(`Work order #${res.ticketNumber}`);
			onCreated(Boolean(tech));
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 grid place-items-end bg-bg/70 p-4 sm:place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "w-full max-w-lg space-y-3 p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold",
					children: "Create Work Order"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					placeholder: "Ticket # (blank = next)",
					value: ticket,
					onChange: (e) => setTicket(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					placeholder: "Customer name",
					value: customer,
					onChange: (e) => setCustomer(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					placeholder: "Address",
					value: address,
					onChange: (e) => setAddress(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					placeholder: "City",
					value: city,
					onChange: (e) => setCity(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					placeholder: "Task / work detail",
					value: task,
					onChange: (e) => setTask(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-3 gap-2",
					children: [
						"service",
						"callback",
						"warranty"
					].map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `h-11 rounded-md text-sm capitalize ${jobKind === k ? "bg-primary text-primary-fg" : "bg-elevated text-muted"}`,
						onClick: () => setJobKind(k),
						children: k
					}, k))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "time",
						value: start,
						onChange: (e) => setStart(e.target.value)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-11 rounded-md border border-border bg-elevated px-3 text-sm",
						value: tech,
						onChange: (e) => setTech(e.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Unassigned"
						}), techs.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: t.id,
							children: t.name
						}, t.id))]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: onClose,
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: mut.isPending || !customer.trim(),
						onClick: () => mut.mutate({ data: {
							ticketNumber: ticket,
							customerName: customer,
							addressLine: address,
							city,
							appointmentStart: `${date}T${start}:00-04:00`,
							technicianId: tech || null,
							workDetail: task,
							jobKind
						} }),
						children: "Save"
					})]
				})
			]
		})
	});
}
function BoardPage() {
	const profile = useQuery({
		queryKey: ["profile"],
		queryFn: () => getSessionProfile()
	});
	if (profile.data?.employee.role === "technician") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/app/field" });
	if (profile.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, { label: "Opening dispatch…" });
	if (profile.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: profile.error.message
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DispatchBoard, {});
}
//#endregion
export { BoardPage as component };
