import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { _ as formatHours, g as formatDuration, h as formatClock } from "./session.server-DT32kkW4.mjs";
import { f as metersToFeet, h as resolveGpsStatus, i as haversineMeters } from "./queries.server-C0KNibQt.mjs";
import { t as Button } from "./button-3OtcC0YW.mjs";
import { t as Input } from "./input-BJ-PR6KY.mjs";
import { t as Card } from "./card-L2k1Mubk.mjs";
import { n as GpsBadge } from "./status-CJXHZwrD.mjs";
import { c as pingGps, l as setJobSiteToHere, n as clockOut, r as getFieldToday, t as clockIn, u as submitNote } from "./api-D-PkeQOG.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/field-BSY33JA3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useGps(enabled, intervalSec, onPing) {
	const [fix, setFix] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [permission, setPermission] = (0, import_react.useState)("prompt");
	const onPingRef = (0, import_react.useRef)(onPing);
	onPingRef.current = onPing;
	const request = (0, import_react.useCallback)(() => {
		if (!navigator.geolocation) {
			setPermission("unsupported");
			setError("This device does not expose location.");
			return;
		}
		navigator.geolocation.getCurrentPosition((pos) => {
			const next = {
				lat: pos.coords.latitude,
				lng: pos.coords.longitude,
				accuracy: pos.coords.accuracy
			};
			setFix(next);
			setPermission("granted");
			setError(null);
			onPingRef.current?.(next);
		}, (err) => {
			setPermission("denied");
			setError(err.message);
		}, {
			enableHighAccuracy: true,
			timeout: 12e3,
			maximumAge: 5e3
		});
	}, []);
	(0, import_react.useEffect)(() => {
		if (!enabled) return;
		request();
		const id = window.setInterval(request, Math.max(10, intervalSec) * 1e3);
		return () => window.clearInterval(id);
	}, [
		enabled,
		intervalSec,
		request
	]);
	return {
		fix,
		error,
		permission,
		request
	};
}
function FieldPage() {
	const qc = useQueryClient();
	const field = useQuery({
		queryKey: ["field"],
		queryFn: () => getFieldToday(),
		refetchInterval: 2e4
	});
	const [note, setNote] = (0, import_react.useState)("");
	const [selected, setSelected] = (0, import_react.useState)(null);
	const data = field.data;
	const ticket = data?.tickets.find((t) => t.id === selected) ?? data?.currentTicket ?? data?.tickets[0] ?? null;
	const tracking = Boolean(data?.open) || Boolean(data && !data.profile.settings.trackingOnlyDuringWork);
	const pingMut = useMutation({
		mutationFn: pingGps,
		onSuccess: () => qc.invalidateQueries({ queryKey: ["field"] })
	});
	const gps = useGps(Boolean(data) && tracking, data?.profile.settings.gpsIntervalSec ?? 30, (fix) => {
		pingMut.mutate({ data: {
			ticketId: ticket?.id,
			lat: fix.lat,
			lng: fix.lng,
			accuracy: fix.accuracy
		} });
	});
	const inMut = useMutation({
		mutationFn: clockIn,
		onSuccess: () => {
			toast.success("Clocked in");
			qc.invalidateQueries({ queryKey: ["field"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const outMut = useMutation({
		mutationFn: clockOut,
		onSuccess: () => {
			toast.success("Clocked out");
			qc.invalidateQueries({ queryKey: ["field"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const noteMut = useMutation({
		mutationFn: submitNote,
		onSuccess: () => {
			setNote("");
			toast.success("Note submitted");
			qc.invalidateQueries({ queryKey: ["field"] });
		}
	});
	const siteMut = useMutation({
		mutationFn: setJobSiteToHere,
		onSuccess: () => {
			toast.success("Job site set to this location");
			qc.invalidateQueries({ queryKey: ["field"] });
		}
	});
	if (field.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-80 animate-pulse rounded-xl bg-surface" });
	if (field.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: field.error.message
	});
	if (!data) return null;
	const tz = data.profile.settings.timezone;
	const hours = data.hours;
	const distanceFt = gps.fix && ticket?.lat != null && ticket.lng != null ? metersToFeet(haversineMeters(gps.fix.lat, gps.fix.lng, ticket.lat, ticket.lng)) : null;
	const status = resolveGpsStatus({
		hasFix: Boolean(gps.fix),
		distanceFt,
		radiusFt: ticket?.gpsRadiusFt ?? data.profile.settings.gpsRadiusFt,
		approachingMultiplier: data.profile.settings.approachingMultiplier,
		clockedIn: Boolean(data.open && data.open.kind === "work"),
		previouslyOnSite: data.open?.gpsStatus === "WORKING" || data.open?.gpsStatus === "ON_SITE"
	});
	const expected = ticket?.expectedHours ?? 0;
	const actualBillable = hours.billable / 60;
	const canManage = data.profile.employee.role !== "technician";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-lg space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-wide text-subtle",
						children: "Today"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-2xl font-semibold tracking-tight",
						children: data.profile.employee.name
					}),
					data.profile.employee.role !== "technician" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Admin field view — pick a job to demo GPS clock-in."
					}) : null
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GpsBadge, { status })]
			}),
			gps.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-warn",
					children: gps.error
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "secondary",
					onClick: gps.request,
					children: "Enable location"
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] uppercase tracking-wide text-subtle",
						children: "Current ticket"
					}),
					ticket ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/app/jobs/$ticketId",
							params: { ticketId: ticket.id },
							className: "mt-1 block font-mono text-lg text-primary",
							children: ["#", ticket.ticketNumber]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 text-sm font-medium",
							children: ticket.customerName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-sm text-muted",
							children: [
								ticket.addressLine,
								", ",
								ticket.city
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid grid-cols-2 gap-3 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Arrival",
									value: data.open ? formatClock(data.open.clockIn, tz) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Duration",
									value: data.open ? formatDuration((Date.now() - new Date(data.open.clockIn).getTime()) / 6e4) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Billable",
									value: formatHours(actualBillable)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Non-billable",
									value: formatHours(hours.nonBillable / 60)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Codes",
									value: ticket.codes.map((c) => c.code).join(" + ") || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Expected",
									value: `${formatHours(expected)} h`
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 text-xs text-muted",
							children: distanceFt != null ? `${Math.round(distanceFt)} ft from job site · radius ${ticket.gpsRadiusFt} ft` : "Waiting for GPS fix"
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "No assigned jobs today."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 space-y-2",
						children: [
							data.open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "w-full",
								variant: "secondary",
								disabled: !gps.fix || outMut.isPending,
								onClick: () => {
									if (!gps.fix) return;
									outMut.mutate({ data: {
										lat: gps.fix.lat,
										lng: gps.fix.lng,
										accuracy: gps.fix.accuracy,
										ticketId: ticket?.id
									} });
								},
								children: "Clock out"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "w-full",
								disabled: !gps.fix || !ticket || inMut.isPending,
								onClick: () => {
									if (!gps.fix || !ticket) return;
									inMut.mutate({ data: {
										ticketId: ticket.id,
										lat: gps.fix.lat,
										lng: gps.fix.lng,
										accuracy: gps.fix.accuracy,
										kind: "work"
									} });
								},
								children: "Start work"
							}),
							!gps.fix ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "w-full",
								variant: "outline",
								onClick: gps.request,
								children: "Request GPS permission"
							}) : null,
							canManage && gps.fix && ticket ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "w-full",
								variant: "ghost",
								onClick: () => siteMut.mutate({ data: {
									ticketId: ticket.id,
									lat: gps.fix.lat,
									lng: gps.fix.lng
								} }),
								children: "Set this job site to my location"
							}) : null
						]
					})
				]
			}),
			data.tickets.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-2 text-[11px] uppercase tracking-wide text-subtle",
				children: "Assigned jobs"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-1",
				children: data.tickets.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setSelected(t.id),
					className: `flex h-12 w-full items-center justify-between rounded-md px-2 text-left text-sm ${ticket?.id === t.id ? "bg-elevated" : "hover:bg-elevated/60"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-mono",
						children: ["#", t.ticketNumber]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate text-muted",
						children: t.customerName
					})]
				}, t.id))
			})] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] uppercase tracking-wide text-subtle",
				children: "Today's hours"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 grid grid-cols-2 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Worked",
						value: formatHours(hours.worked / 60)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Billable",
						value: formatHours(hours.billable / 60)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Travel",
						value: formatHours(hours.travel / 60)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Admin",
						value: formatHours(hours.admin / 60)
					})
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-2 text-[11px] uppercase tracking-wide text-subtle",
				children: "Note / exception"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex gap-2",
				onSubmit: (e) => {
					e.preventDefault();
					if (!note.trim()) return;
					noteMut.mutate({ data: {
						ticketId: ticket?.id,
						message: note
					} });
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: note,
					onChange: (e) => setNote(e.target.value),
					placeholder: "Late parts, access issue…"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					size: "sm",
					variant: "secondary",
					children: "Send"
				})]
			})] })
		]
	});
}
function Metric({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-[11px] uppercase tracking-wide text-subtle",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "font-mono text-sm tabular",
		children: value
	})] });
}
//#endregion
export { FieldPage as component };
