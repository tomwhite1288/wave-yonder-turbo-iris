import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { C as formatDuration, S as formatClock, a as KIND_LABEL, w as formatHours } from "./session.server-BThkfVCN.mjs";
import { f as resolveGpsStatus, l as metersToFeet, n as haversineMeters } from "./queries.server-CkA3omDT.mjs";
import { t as Button } from "./button-DptnA-9j.mjs";
import { t as Input } from "./input-Cwgm8t2d.mjs";
import { t as Card } from "./card-CugKTQmh.mjs";
import { t as Spinner } from "./spinner-Bz_S9RQQ.mjs";
import { t as Badge } from "./badge-BgqgnlCo.mjs";
import { n as GpsBadge } from "./status-CK2L7Kdp.mjs";
import { c as setJobSiteToHere, l as submitNote, n as getFieldToday, s as pingGps, t as clockOut, u as transitionClock } from "./api-CRRtNY9Y.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as addJobReceipt } from "./api-account-C7rcPmzy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/field-DbwvAceD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var QUEUE_KEY = "fl_gps_queue";
function queueGpsFix(fix) {
	try {
		const raw = localStorage.getItem(QUEUE_KEY);
		const q = raw ? JSON.parse(raw) : [];
		q.push({
			...fix,
			at: Date.now()
		});
		localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-50)));
	} catch {}
}
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
			queueGpsFix(next);
			onPingRef.current?.(next);
		}, (err) => {
			setPermission("denied");
			setError(err.message);
		}, {
			enableHighAccuracy: true,
			timeout: 2e4,
			maximumAge: 3e4
		});
	}, []);
	(0, import_react.useEffect)(() => {
		if (!enabled) return;
		request();
		const ms = Math.max(60, intervalSec) * 1e3;
		const id = window.setInterval(request, ms);
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
	const [receiptAmt, setReceiptAmt] = (0, import_react.useState)("");
	const [receiptVendor, setReceiptVendor] = (0, import_react.useState)("");
	const data = field.data;
	const ticket = data?.tickets.find((t) => t.id === selected) ?? data?.currentTicket ?? data?.tickets[0] ?? null;
	const pingMut = useMutation({
		mutationFn: pingGps,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["field"] });
			qc.invalidateQueries({ queryKey: ["dispatch"] });
		}
	});
	const gps = useGps(Boolean(data), data?.profile.settings.gpsIntervalSec ?? 300, (fix) => {
		pingMut.mutate({ data: {
			ticketId: ticket?.id,
			lat: fix.lat,
			lng: fix.lng,
			accuracy: fix.accuracy
		} });
	});
	const switchMut = useMutation({
		mutationFn: transitionClock,
		onSuccess: (res) => {
			const min = res.confirmMin ?? 15;
			toast.success(res.gpsBacked ? "Status updated — GPS confirmed" : `Status posted — GPS has ${min} min to confirm`);
			qc.invalidateQueries({ queryKey: ["field"] });
			qc.invalidateQueries({ queryKey: ["dispatch"] });
			qc.invalidateQueries({ queryKey: ["exceptions"] });
			qc.invalidateQueries({ queryKey: ["inbox"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const outMut = useMutation({
		mutationFn: clockOut,
		onSuccess: (res) => {
			toast.success(res.gpsBacked ? "Clocked out — paid" : "Clocked out — time not paid");
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
	const receiptMut = useMutation({
		mutationFn: addJobReceipt,
		onSuccess: () => {
			setReceiptAmt("");
			setReceiptVendor("");
			toast.success("Receipt posted against the code parts range");
			qc.invalidateQueries({ queryKey: ["field"] });
			qc.invalidateQueries({ queryKey: ["exceptions"] });
		},
		onError: (e) => toast.error(e.message)
	});
	if (field.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, { label: "Loading today’s jobs…" });
	if (field.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: field.error.message
	});
	if (!data) return null;
	const tz = data.profile.settings.timezone;
	const hours = data.hours;
	const settings = data.profile.settings;
	const distanceFt = gps.fix && ticket?.lat != null && ticket.lng != null ? metersToFeet(haversineMeters(gps.fix.lat, gps.fix.lng, ticket.lat, ticket.lng)) : null;
	const officeFt = gps.fix ? metersToFeet(haversineMeters(gps.fix.lat, gps.fix.lng, settings.officeLat, settings.officeLng)) : null;
	const status = resolveGpsStatus({
		hasFix: Boolean(gps.fix),
		distanceFt,
		radiusFt: ticket?.gpsRadiusFt ?? settings.gpsRadiusFt,
		approachingMultiplier: settings.approachingMultiplier,
		clockedIn: Boolean(data.open && (data.open.kind === "work" || data.open.kind === "show")),
		previouslyOnSite: data.open?.gpsStatus === "WORKING" || data.open?.gpsStatus === "ON_SITE",
		officeDistanceFt: officeFt,
		officeRadiusFt: settings.officeRadiusFt,
		accuracyM: gps.fix?.accuracy ?? null
	});
	const expected = ticket?.expectedHours ?? 0;
	const busy = switchMut.isPending || outMut.isPending;
	function punch(kind) {
		switchMut.mutate({ data: {
			ticketId: ticket?.id,
			lat: gps.fix?.lat ?? null,
			lng: gps.fix?.lng ?? null,
			accuracy: gps.fix?.accuracy ?? null,
			kind
		} });
	}
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [
							"Paid: in transit, show, working, office at ",
							settings.officeAddress,
							"."
						]
					})
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
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium",
									children: ticket.customerName
								}),
								ticket.jobKind === "callback" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "warn",
									children: "Callback"
								}) : null,
								ticket.jobKind === "warranty" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "info",
									children: "Warranty"
								}) : null
							]
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
									label: "Status",
									value: data.open ? KIND_LABEL[data.open.kind] : "Off the clock"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "GPS",
									value: data.open?.gpsConfirmStatus === "pending" ? `Confirming (${settings.gpsConfirmMin} min)` : data.open?.gpsConfirmStatus === "failed" ? "Not confirmed — needs approval" : data.open?.gpsConfirmStatus === "confirmed" ? "Confirmed on site" : gps.fix ? "Live" : "Waiting"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Since",
									value: data.open ? formatClock(data.open.clockIn, tz) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Paid today",
									value: formatHours(hours.paid / 60)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Unpaid",
									value: formatHours(hours.unpaid / 60)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Codes",
									value: ticket.codes.map((c) => c.code).join(" + ") || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Sold hours",
									value: `${formatHours(expected)} h`
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 text-xs text-muted",
							children: [
								gps.fix ? `${gps.fix.lat.toFixed(5)}, ${gps.fix.lng.toFixed(5)} ±${Math.round(gps.fix.accuracy)} m` : "Waiting for GPS",
								distanceFt != null ? ` · ${Math.round(distanceFt)} ft from job (radius ${Math.round(ticket.gpsRadiusFt + (gps.fix ? gps.fix.accuracy * 3.28084 : 0))} ft with accuracy)` : ticket.lat == null ? " · this job has no pin yet — confirm location below" : "",
								officeFt != null ? ` · ${Math.round(officeFt)} ft from shop` : ""
							]
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "No assigned jobs today. Office allocation still works."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 grid grid-cols-2 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								disabled: busy,
								onClick: () => punch("travel"),
								children: "In transit"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								disabled: !ticket || busy,
								onClick: () => punch("show"),
								children: "On site"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								disabled: !ticket || busy,
								onClick: () => punch("work"),
								children: "Working"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								disabled: busy,
								onClick: () => punch("office"),
								children: "At office"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							disabled: busy,
							onClick: () => punch("break"),
							children: "Break"
						}), data.open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							disabled: outMut.isPending,
							onClick: () => {
								outMut.mutate({ data: {
									lat: gps.fix?.lat ?? null,
									lng: gps.fix?.lng ?? null,
									accuracy: gps.fix?.accuracy ?? null,
									ticketId: ticket?.id
								} });
							},
							children: "Clock out"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: gps.request,
							children: "Request GPS"
						})]
					}),
					gps.fix && ticket ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-2 w-full",
						variant: "secondary",
						onClick: () => siteMut.mutate({ data: {
							ticketId: ticket.id,
							lat: gps.fix.lat,
							lng: gps.fix.lng
						} }),
						children: ticket.lat == null ? "Pin this job to my location" : "Update job pin to my location"
					}) : null,
					gps.fix ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-2 w-full",
						variant: "outline",
						onClick: gps.request,
						children: "Confirm GPS now"
					}) : null
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
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "truncate text-muted",
						children: [t.customerName, t.jobKind === "callback" ? " · callback" : t.jobKind === "warranty" ? " · warranty" : ""]
					})]
				}, t.id))
			})] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] uppercase tracking-wide text-subtle",
				children: "Today — payable vs clocked"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 grid grid-cols-2 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Paid",
						value: formatHours(hours.paid / 60)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Unpaid",
						value: formatHours(hours.unpaid / 60)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Drive",
						value: formatHours(hours.travel / 60)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "On site",
						value: formatHours((hours.billable + hours.show) / 60)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Office",
						value: formatHours(hours.office / 60)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Break",
						value: formatDuration(hours.breakMin)
					})
				]
			})] }),
			ticket ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-2 text-[11px] uppercase tracking-wide text-subtle",
					children: "Parts receipt"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-xs text-muted",
					children: "Enter the vendor receipt total. Ledger compares it to the code parts range and posts rough gross profit on the job — not a petty-cash lump."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "grid grid-cols-[1fr_1fr_auto] gap-2",
					onSubmit: (e) => {
						e.preventDefault();
						const amount = Number(receiptAmt);
						if (!ticket || !(amount > 0)) return;
						receiptMut.mutate({ data: {
							ticketId: ticket.id,
							amount,
							vendor: receiptVendor,
							code: ticket.codes[0]?.code
						} });
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							inputMode: "decimal",
							value: receiptAmt,
							onChange: (e) => setReceiptAmt(e.target.value),
							placeholder: "Receipt $"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: receiptVendor,
							onChange: (e) => setReceiptVendor(e.target.value),
							placeholder: "Vendor"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							size: "sm",
							variant: "secondary",
							disabled: receiptMut.isPending,
							children: "Add"
						})
					]
				})
			] }) : null,
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
