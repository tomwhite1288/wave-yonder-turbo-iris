import { getSql } from "@/lib/db";
import { newId, todayIso } from "@/lib/utils";
import { writeAudit } from "./session.server";

function stamp(dateIso: string, time: string): string {
  return `${dateIso}T${time}-04:00`;
}

function addDays(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T12:00:00-04:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type JobSeed = {
  id: string;
  number: string;
  customer: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  start: string;
  end: string;
  tech: string;
  invoice: string;
  amount: number;
  labor: number;
  parts: number;
  status: string;
  codes: string[];
  notes?: string;
};

export async function hydrateToday(companyId: string): Promise<void> {
  const sql = await getSql();
  const today = todayIso("America/New_York");
  const flag = await sql<{ value: string }>`
    select value from settings where company_id = ${companyId} and key = 'hydrated_day'
  `;
  if (flag[0]?.value === `${today}:v2`) return;

  await sql`delete from gps_events where company_id = ${companyId} and (session_id like 'sess_%' or ticket_id like 'tkt_%')`;
  await sql`delete from truck_movements where ticket_id like 'tkt_%'`;
  await sql`delete from exceptions where id in ('ex_elena_under', 'ex_derrick_left', 'ex_y_ot') or ticket_id like 'tkt_%'`;
  await sql`delete from time_entries where id like 'te_%' or ticket_id like 'tkt_%'`;
  await sql`delete from ticket_codes where ticket_id like 'tkt_%'`;
  await sql`delete from ticket_parts where ticket_id like 'tkt_%'`;
  await sql`delete from tickets where id like 'tkt_%'`;

  const yesterday = addDays(today, -1);
  const jobs: JobSeed[] = [
    {
      id: "tkt_123456",
      number: "123456",
      customer: "Harrington Residence",
      address: "1201 N Market St",
      city: "Wilmington",
      state: "DE",
      zip: "19801",
      lat: 39.748,
      lng: -75.547,
      start: stamp(today, "08:00:00"),
      end: stamp(today, "11:00:00"),
      tech: "emp_john",
      invoice: "INV-88421",
      amount: 647.5,
      labor: 462.5,
      parts: 185,
      status: "in_progress",
      codes: ["B", "C"],
    },
    {
      id: "tkt_123457",
      number: "123457",
      customer: "Oak Lane Dental",
      address: "42 E Main St",
      city: "Newark",
      state: "DE",
      zip: "19711",
      lat: 39.6837,
      lng: -75.7499,
      start: stamp(today, "10:00:00"),
      end: stamp(today, "12:30:00"),
      tech: "emp_marcus",
      invoice: "INV-88422",
      amount: 370,
      labor: 370,
      parts: 0,
      status: "scheduled",
      codes: ["PM2", "A"],
    },
    {
      id: "tkt_123458",
      number: "123458",
      customer: "Riverfront Lofts #4B",
      address: "500 Delaware Ave",
      city: "Wilmington",
      state: "DE",
      zip: "19801",
      lat: 39.7485,
      lng: -75.551,
      start: stamp(today, "07:30:00"),
      end: stamp(today, "10:00:00"),
      tech: "emp_elena",
      invoice: "INV-88423",
      amount: 185,
      labor: 185,
      parts: 0,
      status: "in_progress",
      codes: ["A"],
    },
    {
      id: "tkt_123459",
      number: "123459",
      customer: "New Castle Public Library",
      address: "424 Delaware St",
      city: "New Castle",
      state: "DE",
      zip: "19720",
      lat: 39.6598,
      lng: -75.5664,
      start: stamp(today, "07:00:00"),
      end: stamp(today, "09:30:00"),
      tech: "emp_derrick",
      invoice: "INV-88424",
      amount: 555,
      labor: 370,
      parts: 185,
      status: "complete",
      codes: ["CAP", "C"],
    },
    {
      id: "tkt_123460",
      number: "123460",
      customer: "Christiana Commons",
      address: "15 S DuPont Hwy",
      city: "New Castle",
      state: "DE",
      zip: "19720",
      lat: 39.668,
      lng: -75.5675,
      start: stamp(today, "13:00:00"),
      end: stamp(today, "16:00:00"),
      tech: "emp_john",
      invoice: "",
      amount: 0,
      labor: 0,
      parts: 0,
      status: "scheduled",
      codes: ["TOI", "FAU"],
    },
    {
      id: "tkt_y_john",
      number: "123401",
      customer: "Brandywine School District",
      address: "1311 Brandywine Blvd",
      city: "Wilmington",
      state: "DE",
      zip: "19809",
      lat: 39.769,
      lng: -75.529,
      start: stamp(yesterday, "08:00:00"),
      end: stamp(yesterday, "12:00:00"),
      tech: "emp_john",
      invoice: "INV-88390",
      amount: 740,
      labor: 555,
      parts: 185,
      status: "complete",
      codes: ["E"],
    },
    {
      id: "tkt_y_marcus",
      number: "123402",
      customer: "Pike Creek Medical",
      address: "3105 Limestone Rd",
      city: "Wilmington",
      state: "DE",
      zip: "19808",
      lat: 39.735,
      lng: -75.696,
      start: stamp(yesterday, "08:30:00"),
      end: stamp(yesterday, "11:30:00"),
      tech: "emp_marcus",
      invoice: "INV-88391",
      amount: 429,
      labor: 370,
      parts: 59,
      status: "complete",
      codes: ["BRD"],
    },
    {
      id: "tkt_y_elena",
      number: "123403",
      customer: "The Mill Apartments",
      address: "200 S Dupont St",
      city: "Wilmington",
      state: "DE",
      zip: "19805",
      lat: 39.732,
      lng: -75.568,
      start: stamp(yesterday, "07:45:00"),
      end: stamp(yesterday, "15:30:00"),
      tech: "emp_elena",
      invoice: "INV-88392",
      amount: 1649,
      labor: 740,
      parts: 909,
      status: "complete",
      codes: ["WH-R"],
    },
    {
      id: "tkt_y_derrick",
      number: "123404",
      customer: "Fox Run HOA Clubhouse",
      address: "101 Fox Run Blvd",
      city: "Bear",
      state: "DE",
      zip: "19701",
      lat: 39.629,
      lng: -75.658,
      start: stamp(yesterday, "07:15:00"),
      end: stamp(yesterday, "16:40:00"),
      tech: "emp_derrick",
      invoice: "INV-88393",
      amount: 980,
      labor: 740,
      parts: 240,
      status: "complete",
      codes: ["E", "THM"],
    },
  ];

  const codes = await sql<{ code: string; hours: number; labor_value: number }>`
    select code, hours, labor_value from code_book where company_id = ${companyId}
  `;
  const codeMap = new Map(codes.map((c) => [c.code, c]));

  for (const job of jobs) {
    await sql`
      insert into tickets (
        id, company_id, ticket_number, customer_name, address_line, city, state, zip,
        lat, lng, scheduled_start, scheduled_end, technician_id, invoice_number,
        invoice_amount, labor_amount, parts_amount, status, source
      ) values (
        ${job.id}, ${companyId}, ${job.number}, ${job.customer}, ${job.address},
        ${job.city}, ${job.state}, ${job.zip}, ${job.lat}, ${job.lng},
        ${job.start}, ${job.end}, ${job.tech}, ${job.invoice || null},
        ${job.amount}, ${job.labor}, ${job.parts}, ${job.status}, 'seed'
      )
    `;
    for (const code of job.codes) {
      const def = codeMap.get(code);
      await sql`
        insert into ticket_codes (id, ticket_id, code, hours_expected, labor_value)
        values (
          ${newId("tc")}, ${job.id}, ${code},
          ${def?.hours ?? 1}, ${def?.labor_value ?? 185}
        )
      `;
    }
  }

  await sql`
    insert into ticket_parts (id, ticket_id, part_id, quantity, unit_cost, unit_price)
    values
      (${newId("tp")}, 'tkt_123456', 'pt_moen_1225', 1, 12.40, 28.95),
      (${newId("tp")}, 'tkt_123456', 'pt_fluid_400a', 1, 7.10, 18.95),
      (${newId("tp")}, 'tkt_123459', 'pt_ge_cap45', 1, 14.80, 42.00),
      (${newId("tp")}, 'tkt_y_elena', 'pt_ao_pro40', 1, 780.00, 1649.00)
  `;

  // John: clocked in at Harrington, still working.
  await sql`
    insert into time_entries (
      id, company_id, employee_id, ticket_id, kind, clock_in, clock_in_lat, clock_in_lng,
      clock_in_accuracy, clock_in_distance_ft, billable_minutes, gps_status,
      original_clock_in, approval_status, created_by
    ) values (
      'te_john_now', ${companyId}, 'emp_john', 'tkt_123456', 'work',
      ${stamp(today, "08:14:00")}, 39.74805, -75.5469, 12, 28, 0, 'WORKING',
      ${stamp(today, "08:14:00")}, 'pending', 'system'
    )
  `;
  await sql`
    insert into gps_events (id, company_id, employee_id, ticket_id, lat, lng, accuracy, recorded_at, distance_ft, status, session_id)
    values
      (${newId("gps")}, ${companyId}, 'emp_john', 'tkt_123456', 39.74805, -75.5469, 12, ${stamp(today, "08:14:00")}, 28, 'WORKING', 'sess_john'),
      (${newId("gps")}, ${companyId}, 'emp_john', 'tkt_123456', 39.74802, -75.54705, 9, now(), 22, 'WORKING', 'sess_john')
  `;

  // Marcus: traveling toward Newark job, approaching.
  await sql`
    insert into time_entries (
      id, company_id, employee_id, ticket_id, kind, clock_in, clock_out,
      clock_in_lat, clock_in_lng, clock_out_lat, clock_out_lng,
      clock_in_distance_ft, clock_out_distance_ft, billable_minutes, non_billable_minutes,
      gps_status, original_clock_in, original_clock_out, approval_status, created_by
    ) values (
      'te_marcus_travel', ${companyId}, 'emp_marcus', 'tkt_123457', 'travel',
      ${stamp(today, "09:22:00")}, null,
      39.72, -75.64, null, null,
      8200, null, 0, 0, 'APPROACHING',
      ${stamp(today, "09:22:00")}, null, 'pending', 'system'
    )
  `;
  await sql`
    insert into gps_events (id, company_id, employee_id, ticket_id, lat, lng, accuracy, recorded_at, distance_ft, status, session_id)
    values (${newId("gps")}, ${companyId}, 'emp_marcus', 'tkt_123457', 39.6849, -75.7495, 18, now(), 420, 'APPROACHING', 'sess_marcus')
  `;

  // Elena: on site longer than codes support (under-billed).
  await sql`
    insert into time_entries (
      id, company_id, employee_id, ticket_id, kind, clock_in,
      clock_in_lat, clock_in_lng, clock_in_accuracy, clock_in_distance_ft,
      billable_minutes, gps_status, original_clock_in, approval_status, created_by
    ) values (
      'te_elena_now', ${companyId}, 'emp_elena', 'tkt_123458', 'work',
      ${stamp(today, "07:41:00")}, 39.74848, -75.55105, 8, 19, 0, 'WORKING',
      ${stamp(today, "07:41:00")}, 'pending', 'system'
    )
  `;
  await sql`
    insert into gps_events (id, company_id, employee_id, ticket_id, lat, lng, accuracy, recorded_at, distance_ft, status, session_id)
    values (${newId("gps")}, ${companyId}, 'emp_elena', 'tkt_123458', 39.74848, -75.55105, 8, now(), 19, 'WORKING', 'sess_elena')
  `;
  await sql`
    insert into exceptions (id, company_id, employee_id, ticket_id, time_entry_id, kind, severity, message, status)
    values (
      'ex_elena_under', ${companyId}, 'emp_elena', 'tkt_123458', 'te_elena_now',
      'under_billed', 'warning',
      'Invoice codes represent 1.0 hour. Technician billable time already exceeds the ±15 minute tolerance.',
      'open'
    )
  `;

  // Derrick: morning job complete, left site, currently off site.
  await sql`
    insert into time_entries (
      id, company_id, employee_id, ticket_id, kind, clock_in, clock_out,
      clock_in_lat, clock_in_lng, clock_out_lat, clock_out_lng,
      clock_in_distance_ft, clock_out_distance_ft, billable_minutes, non_billable_minutes,
      gps_status, original_clock_in, original_clock_out, approval_status, created_by
    ) values (
      'te_derrick_am', ${companyId}, 'emp_derrick', 'tkt_123459', 'work',
      ${stamp(today, "07:08:00")}, ${stamp(today, "09:44:00")},
      39.6599, -75.5663, 39.671, -75.58,
      42, 623, 148, 8, 'LEFT_SITE',
      ${stamp(today, "07:08:00")}, ${stamp(today, "09:44:00")}, 'pending', 'system'
    )
  `;
  await sql`
    insert into gps_events (id, company_id, employee_id, ticket_id, lat, lng, accuracy, recorded_at, distance_ft, status, session_id)
    values
      (${newId("gps")}, ${companyId}, 'emp_derrick', 'tkt_123459', 39.6599, -75.5663, 10, ${stamp(today, "07:08:00")}, 42, 'WORKING', 'sess_derrick'),
      (${newId("gps")}, ${companyId}, 'emp_derrick', 'tkt_123459', 39.671, -75.58, 16, ${stamp(today, "09:44:00")}, 623, 'LEFT_SITE', 'sess_derrick'),
      (${newId("gps")}, ${companyId}, 'emp_derrick', null, 39.68, -75.59, 20, now(), null, 'OFF_SITE', 'sess_derrick')
  `;
  await sql`
    insert into exceptions (id, company_id, employee_id, ticket_id, time_entry_id, kind, severity, message, status)
    values (
      'ex_derrick_left', ${companyId}, 'emp_derrick', 'tkt_123459', 'te_derrick_am',
      'left_site', 'info',
      'Device moved 623 ft from the job-site radius at 9:44 AM after clock-out.',
      'open'
    )
  `;

  // Yesterday closed days.
  const yJobs = [
    { id: "te_y_john", tech: "emp_john", ticket: "tkt_y_john", in: stamp(yesterday, "07:52:00"), out: stamp(yesterday, "16:18:00"), bill: 390, nb: 42 },
    { id: "te_y_marcus", tech: "emp_marcus", ticket: "tkt_y_marcus", in: stamp(yesterday, "07:48:00"), out: stamp(yesterday, "16:05:00"), bill: 360, nb: 55 },
    { id: "te_y_elena", tech: "emp_elena", ticket: "tkt_y_elena", in: stamp(yesterday, "07:33:00"), out: stamp(yesterday, "16:41:00"), bill: 420, nb: 38 },
    { id: "te_y_derrick", tech: "emp_derrick", ticket: "tkt_y_derrick", in: stamp(yesterday, "07:18:00"), out: stamp(yesterday, "16:37:00"), bill: 465, nb: 22 },
  ];
  for (const y of yJobs) {
    await sql`
      insert into time_entries (
        id, company_id, employee_id, ticket_id, kind, clock_in, clock_out,
        billable_minutes, non_billable_minutes, gps_status,
        original_clock_in, original_clock_out, approval_status, approved_by, approved_at, created_by
      ) values (
        ${y.id}, ${companyId}, ${y.tech}, ${y.ticket}, 'work', ${y.in}, ${y.out},
        ${y.bill}, ${y.nb}, 'ON_SITE', ${y.in}, ${y.out}, 'approved', 'emp_sarah', ${stamp(yesterday, "17:10:00")}, 'system'
      )
    `;
    await sql`
      insert into timecards (id, company_id, employee_id, work_date, status, approved_by, approved_at, manager_note)
      values (${newId("tc")}, ${companyId}, ${y.tech}, ${yesterday}::date, 'approved', 'emp_sarah', ${stamp(yesterday, "17:10:00")}, 'Closed from field board')
      on conflict do nothing
    `;
  }

  await sql`
    insert into exceptions (id, company_id, employee_id, ticket_id, kind, severity, message, status)
    values (
      'ex_y_ot', ${companyId}, 'emp_derrick', 'tkt_y_derrick', 'overtime', 'info',
      'Yesterday actual (9.3h) exceeded scheduled 8.0h. Overtime will apply at 1.5x.',
      'acknowledged'
    )
  `;

  await writeAudit({
    companyId,
    actorName: "System",
    action: "hydrate_day",
    entityType: "tickets",
    newValue: { day: today, jobs: jobs.length },
    reason: "Seeded live companion data for the current workday",
  });

  await sql`
    insert into settings (company_id, key, value, updated_at)
    values (${companyId}, 'hydrated_day', ${`${today}:v2`}, now())
    on conflict (company_id, key) do update set value = excluded.value, updated_at = now()
  `;
}
