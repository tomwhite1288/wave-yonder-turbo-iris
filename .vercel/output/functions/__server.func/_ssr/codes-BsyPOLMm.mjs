import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { _ as formatHours, v as formatMoney } from "./session.server-DT32kkW4.mjs";
import { t as Button } from "./button-3OtcC0YW.mjs";
import { t as Input } from "./input-BJ-PR6KY.mjs";
import { t as Card } from "./card-L2k1Mubk.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as listCodes, m as upsertCode, s as importCodes } from "./api-ops-Bo8xhUq6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/codes-BsyPOLMm.js
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
	return pool.map((c) => {
		let score = 0;
		let tag = "search";
		if (hours != null && Number.isFinite(hours)) {
			const dh = Math.abs(c.hours - hours);
			if (dh < .001) {
				score += 50;
				tag = "match";
			} else if (dh <= .5) {
				score += 30 - dh * 10;
				tag = "range";
			} else if (dh <= 1) {
				score += 12 - dh * 4;
				tag = "range";
			}
		}
		if (parts != null && Number.isFinite(parts) && parts > 0) {
			if (c.partsAllowance >= parts && c.partsAllowance <= parts * 1.25) {
				score += 24;
				if (tag === "search") tag = "range";
			} else if (Math.abs(c.partsAllowance - parts) <= Math.max(25, parts * .2)) {
				score += 14;
				if (tag === "search") tag = "range";
			}
		}
		if (q && c.code.toLowerCase() === q) score += 40;
		if (q && c.description.toLowerCase().startsWith(q)) score += 10;
		return {
			item: c,
			score,
			tag
		};
	}).filter((s) => hours == null && parts == null && !q ? true : s.score > 0 || q && s.tag === "search").sort((a, b) => b.score - a.score || a.item.hours - b.item.hours).slice(0, 40);
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
	const imp = useMutation({
		mutationFn: importCodes,
		onSuccess: (res) => {
			toast.success(`Imported ${res.upserted} codes`);
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
		imp.mutate({ data: { rows } });
	}
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-surface" });
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
				children: "Invoice codes stay separate from plumbing and HVAC job codes. Import CSV yourself for beta — nothing is auto-loaded."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: "Lookup"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Search by description, or enter hours + parts allowance to find matching and in-range codes."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-2 sm:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Description or code",
								value: query,
								onChange: (e) => setQuery(e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Hours",
								inputMode: "decimal",
								value: hours,
								onChange: (e) => setHours(e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Parts allowance $",
								inputMode: "decimal",
								value: parts,
								onChange: (e) => setParts(e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: () => {
									setQuery("");
									setHours("");
									setParts("");
								},
								children: "Clear"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [BOOKS.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setBook(b.id),
					className: `h-9 rounded-md px-3 text-xs font-medium ${book === b.id ? "bg-primary text-primary-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]"}`,
					children: b.label
				}, b.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "ml-auto text-xs text-muted",
					children: [
						filtered.length,
						" shown · ",
						items.length,
						" in book"
					]
				})]
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
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-xs text-muted",
								children: [
									"Sample packs (not loaded):",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-primary underline-offset-2 hover:underline",
										href: "/samples/codes-all.csv",
										download: true,
										children: "all books"
									}),
									" · ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-primary underline-offset-2 hover:underline",
										href: "/samples/codes-invoice.csv",
										download: true,
										children: "invoice"
									}),
									" · ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-primary underline-offset-2 hover:underline",
										href: "/samples/codes-plumbing.csv",
										download: true,
										children: "plumbing"
									}),
									" · ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-primary underline-offset-2 hover:underline",
										href: "/samples/codes-hvac.csv",
										download: true,
										children: "HVAC"
									})
								]
							})
						]
					})
				]
			}) : null,
			items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Code book is empty on purpose. Import the beta CSV when you are ready."
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
								children: item.code
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: item.description
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
