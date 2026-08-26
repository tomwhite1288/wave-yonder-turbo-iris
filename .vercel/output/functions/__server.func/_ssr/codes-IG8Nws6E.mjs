import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { T as formatMoney, w as formatHours } from "./session.server-BThkfVCN.mjs";
import { t as Button } from "./button-DptnA-9j.mjs";
import { t as Input } from "./input-Cwgm8t2d.mjs";
import { t as Card } from "./card-CugKTQmh.mjs";
import { t as Spinner } from "./spinner-Bz_S9RQQ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as listCodes, p as upsertCode, s as importCodes } from "./api-ops-DOOYjFmA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/codes-IG8Nws6E.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function parseCsv(text) {
	const lines = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim().length);
	if (lines.length === 0) return [];
	const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
	return lines.slice(1).map((line) => {
		const cells = splitCsvLine(line);
		const row = {};
		headers.forEach((h, i) => {
			row[h] = (cells[i] ?? "").trim();
		});
		return row;
	});
}
function splitCsvLine(line) {
	const out = [];
	let cur = "";
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (inQuotes) {
			if (ch === "\"") {
				if (line[i + 1] === "\"") {
					cur += "\"";
					i += 1;
				} else inQuotes = false;
			} else cur += ch;
		} else if (ch === "\"") inQuotes = true;
		else if (ch === ",") {
			out.push(cur);
			cur = "";
		} else cur += ch;
	}
	out.push(cur);
	return out;
}
function inferBook(filename, row) {
	const fromCol = (row.book || row.catalog || "").toLowerCase();
	if (fromCol.includes("hvac")) return "hvac";
	if (fromCol.includes("plumb")) return "plumbing";
	if (fromCol.includes("invoice") || fromCol.includes("labor") || fromCol.includes("pm")) return "invoice";
	const name = filename.toLowerCase();
	if (name.includes("hvac")) return "hvac";
	if (name.includes("plumb")) return "plumbing";
	if (name.includes("invoice")) return "invoice";
	const trade = (row.trade || "").toLowerCase();
	if (trade === "hvac") return "hvac";
	if (trade === "plumbing") return "plumbing";
	const cat = (row.category || "").toLowerCase();
	if (cat.includes("hvac")) return "hvac";
	if (cat.includes("plumb") || cat.includes("drain") || cat.includes("install")) return "plumbing";
	return "invoice";
}
function rowToImport(row, filename) {
	const code = (row.code || row.item || "").trim();
	if (!code) return null;
	const n = (v) => v ?? "";
	return {
		book: inferBook(filename, row),
		code,
		description: n(row.description || row.desc || row.name),
		category: n(row.category),
		trade: n(row.trade),
		hours: n(row.hours || row.typical_hrs || row.typicalhrs),
		parts_allowance: n(row.parts_allowance || row.partscost || row.parts_cost),
		list_price: n(row.list_price || row.listprice || row.labor_value || row.laborvalue),
		labor_value: n(row.labor_value || row.laborvalue || row.list_price),
		active: n(row.active || "true"),
		notes: n(row.notes)
	};
}
function findMatchingCodes(items, opts) {
	const q = (opts.query ?? "").trim().toLowerCase();
	let pool = items;
	if (opts.book && opts.book !== "all") pool = pool.filter((c) => c.book === opts.book);
	if (q) pool = pool.filter((c) => `${c.code} ${c.description} ${c.category}`.toLowerCase().includes(q));
	const hours = opts.hours;
	const parts = opts.parts;
	const hourWindow = opts.hourWindow ?? 1;
	const partsPct = opts.partsPct ?? .25;
	return pool.map((c) => {
		let score = 0;
		let tag = "search";
		if (hours != null && Number.isFinite(hours)) {
			const dh = Math.abs(c.hours - hours);
			if (dh < .001) {
				score += 50;
				tag = "match";
			} else if (dh <= hourWindow * .5) {
				score += 30 - dh * 10;
				tag = "range";
			} else if (dh <= hourWindow) {
				score += 12 - dh * 4;
				tag = "range";
			}
		}
		if (parts != null && Number.isFinite(parts) && parts > 0) {
			const lo = parts;
			const hi = parts * (1 + partsPct);
			if (c.partsAllowance >= lo && c.partsAllowance <= hi) {
				score += 24;
				if (tag === "search") tag = "range";
			} else if (Math.abs(c.partsAllowance - parts) <= Math.max(25, parts * partsPct)) {
				score += 14;
				if (tag === "search") tag = "range";
			}
		}
		if (q && c.code.toLowerCase() === q) score += 40;
		if (q) {
			const desc = c.description.toLowerCase();
			if (desc.startsWith(q)) score += 18;
			else if (desc.split(/[\s,/·-]+/).some((w) => w.startsWith(q))) score += 14;
			else if (desc.includes(q)) score += 8;
		}
		return {
			item: c,
			score,
			tag
		};
	}).filter((s) => hours == null && parts == null && !q ? true : s.score > 0 || q && s.tag === "search").sort((a, b) => b.score - a.score || a.item.hours - b.item.hours).slice(0, 80);
}
var BOOKS = [
	{
		id: "all",
		label: "All"
	},
	{
		id: "invoice",
		label: "Invoice"
	},
	{
		id: "plumbing",
		label: "Plumbing"
	},
	{
		id: "hvac",
		label: "HVAC"
	}
];
function highlight(text, query) {
	const q = query.trim();
	if (!q) return text;
	const i = text.toLowerCase().indexOf(q.toLowerCase());
	if (i < 0) return text;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		text.slice(0, i),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("mark", {
			className: "rounded-sm bg-primary/20 text-fg",
			children: text.slice(i, i + q.length)
		}),
		text.slice(i + q.length)
	] });
}
function CodesPage() {
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["codes"],
		queryFn: () => listCodes()
	});
	const [book, setBook] = (0, import_react.useState)("all");
	const [query, setQuery] = (0, import_react.useState)("");
	const [hours, setHours] = (0, import_react.useState)("");
	const [parts, setParts] = (0, import_react.useState)("");
	const [code, setCode] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [newHours, setNewHours] = (0, import_react.useState)("1");
	const [newBook, setNewBook] = (0, import_react.useState)("invoice");
	const add = useMutation({
		mutationFn: upsertCode,
		onSuccess: () => {
			toast.success("Code saved");
			setCode("");
			setDescription("");
			qc.invalidateQueries({ queryKey: ["codes"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const items = q.data?.items ?? [];
	const isAdmin = q.data?.profile.employee.role === "admin";
	const filtered = (0, import_react.useMemo)(() => {
		const hrs = hours.trim() ? Number(hours) : void 0;
		const pts = parts.trim() ? Number(parts) : void 0;
		if (!query && hrs == null && pts == null) return items.filter((c) => book === "all" ? true : c.book === book).map((item) => ({
			item,
			tag: "search",
			score: 0
		}));
		return findMatchingCodes(items, {
			query,
			hours: hrs,
			parts: pts,
			book
		});
	}, [
		items,
		book,
		query,
		hours,
		parts
	]);
	async function onFiles(files) {
		if (!files?.length) return;
		const rows = [];
		for (const file of Array.from(files)) {
			const parsed = parseCsv(await file.text());
			for (const row of parsed) {
				const rec = rowToImport(row, file.name);
				if (rec) rows.push(rec);
			}
		}
		if (!rows.length) {
			toast.error("No code rows found in those files");
			return;
		}
		const CHUNK = 400;
		const toastId = toast.loading(`Importing ${rows.length} codes…`);
		try {
			let upserted = 0;
			let skipped = 0;
			for (let i = 0; i < rows.length; i += CHUNK) {
				const slice = rows.slice(i, i + CHUNK);
				const res = await importCodes({ data: { rows: slice } });
				upserted += res.upserted;
				skipped += res.skipped;
				toast.loading(`Imported ${upserted} of ${rows.length}…`, { id: toastId });
			}
			toast.success(`Imported ${upserted} codes${skipped ? ` (${skipped} skipped)` : ""}`, { id: toastId });
			qc.invalidateQueries({ queryKey: ["codes"] });
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Import failed", { id: toastId });
		}
	}
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, { label: "Loading code book…" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Code book"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Type a description — t, then o-i-l-e-t — and matching codes appear as you type, with estimated hours and parts allowance. Plumbing carries both. HVAC hours are estimated from list price at the shop labor rate; edit a row if your typical time differs."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "space-y-3 rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						autoFocus: true,
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Start typing a description…",
						className: "h-12 text-base"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
						children: BOOKS.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setBook(b.id),
							className: `h-11 rounded-md text-sm ${book === b.id ? "bg-primary text-primary-fg" : "bg-elevated text-muted"}`,
							children: b.label
						}, b.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Est. hours",
							inputMode: "decimal",
							value: hours,
							onChange: (e) => setHours(e.target.value)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Parts $ allowance",
							inputMode: "decimal",
							value: parts,
							onChange: (e) => setParts(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between text-xs text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							filtered.length,
							" shown · ",
							items.length,
							" in book"
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-primary",
							onClick: () => {
								setQuery("");
								setHours("");
								setParts("");
							},
							children: "Clear"
						})]
					})
				]
			}),
			isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: "Add / import"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-2 sm:grid-cols-[1fr_1fr_80px_120px_auto]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Code",
								value: code,
								onChange: (e) => setCode(e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Description",
								value: description,
								onChange: (e) => setDescription(e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Hours",
								value: newHours,
								onChange: (e) => setNewHours(e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "h-11 rounded-md border border-border bg-elevated px-3 text-sm",
								value: newBook,
								onChange: (e) => setNewBook(e.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "invoice",
										children: "Invoice"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "plumbing",
										children: "Plumbing"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "hvac",
										children: "HVAC"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => add.mutate({ data: {
									code,
									description: description || code,
									category: newBook === "invoice" ? "Price/Labor & Material" : newBook,
									trade: newBook === "invoice" ? "both" : newBook,
									book: newBook,
									hours: Number(newHours) || 1,
									laborValue: (Number(newHours) || 1) * (q.data?.profile.settings.laborRate ?? 185),
									active: true
								} }),
								children: "Add"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-1 block text-xs uppercase tracking-wide text-subtle",
								children: "CSV import (one or many files)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "file",
								accept: ".csv,text/csv",
								multiple: true,
								className: "block w-full text-sm text-muted file:mr-3 file:h-10 file:rounded-md file:border-0 file:bg-elevated file:px-3 file:text-fg",
								onChange: (e) => void onFiles(e.target.files)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-xs text-muted",
								children: "Columns: book, code, description, category, trade, hours, parts_allowance, list_price, labor_value, active, notes"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 space-y-1.5 text-xs text-muted",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium text-fg",
										children: "Phone copy — one HTML file on this site"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-primary underline-offset-2 hover:underline",
										href: "/Maichles-Code-Book.html",
										children: "Maichle's Code Book"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [" ", "· the whole truck app, hosted here. Open it on the phone and add to the home screen, or save that single file. No zip, no Python, no extra CSS — iPhone and Android will not host a folder of scripts."] })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium text-fg",
										children: "Office import — download, then import here. Not loaded until you do."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-primary underline-offset-2 hover:underline",
										href: "/samples/codes-hvac.csv",
										download: true,
										children: "HVAC"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: " · 3,159 codes from Service.csv" })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-primary underline-offset-2 hover:underline",
										href: "/samples/codes-plumbing.csv",
										download: true,
										children: "Plumbing"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: " · 1,172 codes from Plumbing.xlsx" })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-primary underline-offset-2 hover:underline",
										href: "/samples/codes-invoice.csv",
										download: true,
										children: "Invoice"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: " · 47 office / labor codes" })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-primary underline-offset-2 hover:underline",
										href: "/samples/codes-all.csv",
										download: true,
										children: "All books"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: " · 4,378 rows, one file" })] })
								]
							})
						]
					})
				]
			}) : null,
			items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Code book is empty on purpose. Download HVAC, plumbing, or all books above and import when you are ready."
			}) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "min-w-[720px] w-full text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-[11px] uppercase tracking-wide text-subtle",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "border-b border-border",
							children: [
								"Code",
								"Description",
								"Book",
								"Hours",
								"Parts $",
								"Labor",
								""
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: h
							}, h))
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: filtered.map(({ item, tag }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/70 last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono",
								children: highlight(item.code, query)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: highlight(item.description, query)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 capitalize text-muted",
								children: item.book
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(item.hours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatMoney(item.partsAllowance)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatMoney(item.laborValue)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-xs uppercase tracking-wide text-subtle",
								children: tag === "match" ? "Match" : tag === "range" ? "In range" : ""
							})
						]
					}, item.id)) })]
				})
			})
		]
	});
}
//#endregion
export { CodesPage as component };
