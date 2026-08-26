import { i as createServerFn } from "./ssr2.mjs";
import { D as getSql, H as roughGrossProfit, J as weekRange, L as newId, M as listEmployees, R as num, V as requireProfile, Y as writeAudit, k as hoursFromEntries, m as assertManager, y as efficiencyForEmployee, z as payrollForEmployee } from "./session.server-BThkfVCN.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { t as shopMiddleware } from "./shop-middleware-By_PdWYR.mjs";
import { a as loadEntries, r as hydrateToday, s as loadTickets } from "./queries.server-CkA3omDT.mjs";
import { t as reconcileWeek } from "./reconcile.server-Bwb9gjpT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-account-CPijQ0bV.js
async function ready(userId) {
	const profile = await requireProfile(userId);
	await hydrateToday(profile.employee.companyId);
	return profile;
}
var addJobReceipt_createServerFn_handler = createServerRpc({
	id: "813052a99e03e5023ce791adb0c13ad3fe2168dc86f3bd7043973716305f8377",
	name: "addJobReceipt",
	filename: "src/lib/field/api-account.ts"
}, (opts) => addJobReceipt.__executeServer(opts));
var addJobReceipt = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(addJobReceipt_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
	if (!(data.amount > 0)) throw new Error("Receipt amount is required");
	const sql = await getSql();
	const ticket = await sql`
      select id, technician_id, ticket_number from tickets
      where id = ${data.ticketId} and company_id = ${profile.employee.companyId}
    `;
	if (!ticket[0]) throw new Error("Ticket not found");
	if (profile.employee.role === "technician" && ticket[0].technician_id !== profile.employee.id) throw Object.assign(/* @__PURE__ */ new Error("Not assigned to this ticket"), { status: 403 });
	const id = newId("rcpt");
	await sql`
      insert into job_receipts (id, company_id, ticket_id, employee_id, code, amount, vendor, notes, created_by)
      values (
        ${id}, ${profile.employee.companyId}, ${data.ticketId}, ${profile.employee.id},
        ${data.code?.trim() || null}, ${data.amount}, ${data.vendor?.trim() || null},
        ${data.notes?.trim() || null}, ${context.userId}
      )
    `;
	if (data.code) {
		const cap = await sql`
        select parts_allowance from code_book
        where company_id = ${profile.employee.companyId} and code = ${data.code.trim().toUpperCase()}
        limit 1
      `;
		const allowance = num(cap[0]?.parts_allowance);
		if (allowance > 0 && data.amount > allowance * 1.05) await sql`
          insert into exceptions (id, company_id, employee_id, ticket_id, kind, severity, message, status)
          values (
            ${newId("ex")}, ${profile.employee.companyId}, ${profile.employee.id}, ${data.ticketId},
            'parts_over_allowance', 'warning',
            ${`Receipt $${data.amount.toFixed(2)} exceeds ${data.code} parts range $${allowance.toFixed(2)} on #${ticket[0].ticket_number}.`},
            'open'
          )
        `;
	}
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "add_receipt",
		entityType: "job_receipt",
		entityId: id,
		ticketId: data.ticketId,
		newValue: {
			amount: data.amount,
			code: data.code,
			vendor: data.vendor
		}
	});
	return { id };
});
var attachTicketCode_createServerFn_handler = createServerRpc({
	id: "253c2156fa6880e989098e01bcecc689a686b89ffadbaea3c5c9a86e357c27b6",
	name: "attachTicketCode",
	filename: "src/lib/field/api-account.ts"
}, (opts) => attachTicketCode.__executeServer(opts));
var attachTicketCode = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(attachTicketCode_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
	assertManager(profile);
	const code = data.code.trim().toUpperCase();
	const sql = await getSql();
	const book = await sql`
      select code, hours, labor_value from code_book
      where company_id = ${profile.employee.companyId} and code = ${code} limit 1
    `;
	const hours = book[0] ? num(book[0].hours) : 1;
	const labor = book[0] ? num(book[0].labor_value) : hours * profile.settings.laborRate;
	await sql`
      insert into ticket_codes (id, ticket_id, code, hours_expected, labor_value)
      values (${newId("tc")}, ${data.ticketId}, ${code}, ${hours}, ${labor})
    `;
	return {
		ok: true,
		hours,
		labor
	};
});
var getAccountabilityWeek_createServerFn_handler = createServerRpc({
	id: "4638a47ba74d7ea83908fd70c609f834f721b5f42db96ede688c80f548f55b2e",
	name: "getAccountabilityWeek",
	filename: "src/lib/field/api-account.ts"
}, (opts) => getAccountabilityWeek.__executeServer(opts));
var getAccountabilityWeek = createServerFn({ method: "GET" }).validator((d) => d ?? {}).middleware([shopMiddleware]).handler(getAccountabilityWeek_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
	const { from, to, today } = weekRange(profile.settings.timezone, data.offsetWeeks ?? 0);
	await reconcileWeek({
		companyId: profile.employee.companyId,
		settings: profile.settings,
		fromIso: from,
		toIso: to
	});
	const techId = profile.employee.role === "technician" ? profile.employee.id : void 0;
	const people = techId ? [profile.employee] : (await listEmployees(profile.employee.companyId, true)).filter((e) => e.role === "technician");
	const entries = await loadEntries({
		companyId: profile.employee.companyId,
		employeeId: techId,
		fromIso: `${from}T00:00:00-04:00`,
		toIso: `${to}T23:59:59-04:00`
	});
	const tickets = await loadTickets(profile.employee.companyId, profile.settings.gpsRadiusFt, techId);
	const sql = await getSql();
	let receipts = [];
	try {
		receipts = await sql`
        select id, ticket_id, employee_id, code, amount, vendor, notes, created_at
        from job_receipts where company_id = ${profile.employee.companyId}
        order by created_at desc
      `;
	} catch {
		receipts = [];
	}
	const recItems = receipts.map((r) => ({
		id: r.id,
		ticketId: r.ticket_id,
		employeeId: r.employee_id,
		code: r.code,
		amount: num(r.amount),
		vendor: r.vendor,
		notes: r.notes,
		createdAt: r.created_at
	}));
	const cards = await sql`
      select id, employee_id, work_date::text, status, manager_note from timecards
      where company_id = ${profile.employee.companyId}
        and work_date between ${from}::date and ${to}::date
    `;
	return {
		profile,
		from,
		to,
		today,
		rows: people.map((employee) => {
			const mine = entries.filter((e) => e.employeeId === employee.id);
			const hours = hoursFromEntries(mine);
			const jobs = tickets.filter((t) => t.technicianId === employee.id);
			const soldHours = jobs.reduce((s, t) => s + t.expectedHours, 0);
			const laborRevenue = jobs.reduce((s, t) => s + t.laborAmount, 0);
			const partsRevenue = jobs.reduce((s, t) => s + t.partsAmount, 0);
			const recCost = recItems.filter((r) => jobs.some((j) => j.id === r.ticketId)).reduce((s, r) => s + r.amount, 0);
			const available = profile.settings.efficiencyAvailableSource === "clock" ? hours.worked / 60 : 42.5;
			return {
				employee,
				hours,
				jobs,
				entries: mine,
				soldHours,
				payroll: payrollForEmployee({
					employee,
					hours,
					settings: profile.settings,
					laborRevenue,
					partsRevenue: partsRevenue || recCost * profile.settings.partsMarkup
				}),
				efficiency: efficiencyForEmployee({
					employee,
					hours,
					availableHours: available,
					soldHours,
					settings: profile.settings,
					laborRevenue,
					partsRevenue: partsRevenue || recCost * profile.settings.partsMarkup
				}),
				receiptCost: recCost,
				gp: roughGrossProfit({
					laborValue: laborRevenue || soldHours * profile.settings.laborRate,
					receiptCost: recCost,
					partsMarkup: profile.settings.partsMarkup,
					paidHours: hours.paid / 60,
					wage: employee.hourlyWage
				}),
				card: cards.find((c) => c.employee_id === employee.id) ?? null
			};
		}),
		receipts: recItems
	};
});
var exportWeekPack_createServerFn_handler = createServerRpc({
	id: "c9bbb0f2ae2532f570a69ed265523d8163f2ce94e98315ae3516627f253e8394",
	name: "exportWeekPack",
	filename: "src/lib/field/api-account.ts"
}, (opts) => exportWeekPack.__executeServer(opts));
var exportWeekPack = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(exportWeekPack_createServerFn_handler, async ({ context }) => {
	const { profile, from, to, rows, receipts } = await getAccountabilityWeek({ data: { offsetWeeks: 0 } });
	assertManager(profile);
	const csvEscape = (v) => {
		const s = String(v ?? "");
		return /[",\n]/.test(s) ? `"${s.replaceAll("\"", "\"\"")}"` : s;
	};
	const csv = (headers, body) => [headers.join(","), ...body.map((r) => r.map(csvEscape).join(","))].join("\n");
	const timecards = csv([
		"employee",
		"kind",
		"ticket",
		"clock_in",
		"clock_out",
		"paid_min",
		"unpaid_min",
		"gps",
		"gps_backed"
	], rows.flatMap((r) => r.entries.map((e) => [
		r.employee.name,
		e.kind,
		e.ticketNumber ?? "",
		e.clockIn,
		e.clockOut ?? "",
		Math.round(e.paidMinutes),
		Math.round(e.unpaidMinutes),
		e.gpsStatus ?? "",
		e.gpsBacked
	])));
	const payroll = csv([
		"employee",
		"paid_hrs",
		"unpaid_hrs",
		"ot",
		"gross",
		"fed",
		"state",
		"fica",
		"net",
		"sold_hrs",
		"st_efficiency"
	], rows.map((r) => [
		r.employee.name,
		r.payroll.paidHours.toFixed(2),
		r.payroll.unpaidHours.toFixed(2),
		r.payroll.overtimeHours.toFixed(2),
		r.payroll.totalWages.toFixed(2),
		r.payroll.taxFed.toFixed(2),
		r.payroll.taxState.toFixed(2),
		r.payroll.taxFica.toFixed(2),
		r.payroll.netPay.toFixed(2),
		r.soldHours.toFixed(2),
		Math.round(r.efficiency.billableEfficiency * 100)
	]));
	const jobs = csv([
		"ticket",
		"customer",
		"tech",
		"codes",
		"sold_hrs",
		"status"
	], rows.flatMap((r) => r.jobs.map((j) => [
		j.ticketNumber,
		j.customerName,
		r.employee.name,
		j.codes.map((c) => c.code).join("+"),
		j.expectedHours,
		j.status
	])));
	const receiptCsv = csv([
		"ticket",
		"code",
		"amount",
		"vendor",
		"notes"
	], receipts.map((r) => [
		r.ticketId,
		r.code ?? "",
		r.amount,
		r.vendor ?? "",
		r.notes ?? ""
	]));
	const emailLines = [
		`Field Ledger — weekly hours ${from} to ${to}`,
		profile.settings.companyName,
		"",
		...rows.flatMap((r) => {
			const tickets = r.jobs.map((j) => {
				const codes = j.codes.map((c) => `${c.code} (${c.hoursExpected.toFixed(2)}h)`).join(", ") || "no codes";
				return `  #${j.ticketNumber}  ${j.customerName}  ${j.jobKind ?? "service"}  codes: ${codes}  sold ${j.expectedHours.toFixed(2)}h`;
			});
			const punches = r.entries.map((e) => {
				return `  ${e.kind}  ${e.ticketNumber ? "#" + e.ticketNumber : "—"}  paid ${(e.paidMinutes / 60).toFixed(2)}h  GPS ${e.gpsBacked ? "confirmed" : e.gpsConfirmStatus || "pending"}`;
			});
			return [
				r.employee.name,
				`  Sold ${r.soldHours.toFixed(2)}h · paid ${r.payroll.paidHours.toFixed(2)}h · efficiency ${Math.round(r.efficiency.billableEfficiency * 100)}%`,
				...tickets,
				...punches,
				""
			];
		})
	];
	return {
		from,
		to,
		json: {
			from,
			to,
			exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
			company: profile.settings.companyName,
			rows,
			receipts
		},
		csv: {
			timecards,
			payroll,
			jobs,
			receipts: receiptCsv
		},
		emailBody: emailLines.join("\n"),
		weeklyEmailTo: profile.settings.weeklyEmailTo
	};
});
//#endregion
export { addJobReceipt_createServerFn_handler, attachTicketCode_createServerFn_handler, exportWeekPack_createServerFn_handler, getAccountabilityWeek_createServerFn_handler };
