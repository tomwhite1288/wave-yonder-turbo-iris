-- Field Ledger companion schema (independent of the primary ticket platform).
-- Ticket number is the association key. All ids are text (Better Auth compatible).

create table if not exists companies (
  id text primary key,
  name text not null,
  legal_name text not null,
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists employees (
  id text primary key,
  company_id text not null references companies(id),
  user_id text,
  employee_number text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  role text not null check (role in ('admin', 'manager', 'technician')),
  department text not null default 'Field',
  labor_classification text not null default 'Technician',
  pay_type text not null default 'hourly',
  phone text,
  vehicle text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);
create unique index if not exists employees_company_number_idx on employees (company_id, employee_number);
create unique index if not exists employees_user_id_idx on employees (user_id) where user_id is not null;
create index if not exists employees_company_email_idx on employees (company_id, lower(email));

create table if not exists pay_rates (
  id text primary key,
  employee_id text not null references employees(id) on delete cascade,
  hourly_wage double precision not null,
  overtime_multiplier double precision not null default 1.5,
  double_time_multiplier double precision not null default 2.0,
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now(),
  created_by text
);
create index if not exists pay_rates_employee_idx on pay_rates (employee_id, effective_from);

create table if not exists schedules (
  id text primary key,
  employee_id text not null references employees(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_minutes integer not null,
  end_minutes integer not null,
  active boolean not null default true
);
create unique index if not exists schedules_emp_day_idx on schedules (employee_id, day_of_week);

create table if not exists schedule_overrides (
  id text primary key,
  employee_id text not null references employees(id) on delete cascade,
  work_date date not null,
  kind text not null,
  start_minutes integer,
  end_minutes integer,
  hours double precision,
  notes text,
  created_at timestamptz not null default now(),
  created_by text
);
create index if not exists schedule_overrides_emp_date_idx on schedule_overrides (employee_id, work_date);

create table if not exists settings (
  company_id text not null references companies(id) on delete cascade,
  key text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (company_id, key)
);

create table if not exists code_book (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  code text not null,
  description text not null,
  category text not null,
  trade text not null default 'both',
  hours double precision not null,
  labor_value double precision not null default 0,
  typical_duration_min integer not null default 60,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists code_book_company_code_idx on code_book (company_id, code);

create table if not exists tickets (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  ticket_number text not null,
  customer_name text not null,
  address_line text not null,
  city text not null,
  state text not null,
  zip text not null,
  lat double precision,
  lng double precision,
  gps_radius_ft double precision,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  technician_id text references employees(id),
  invoice_number text,
  invoice_amount double precision,
  labor_amount double precision,
  parts_amount double precision,
  status text not null default 'scheduled',
  source text not null default 'manual',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);
create unique index if not exists tickets_company_number_idx on tickets (company_id, ticket_number);
create index if not exists tickets_tech_idx on tickets (technician_id, scheduled_start);

create table if not exists ticket_codes (
  id text primary key,
  ticket_id text not null references tickets(id) on delete cascade,
  code text not null,
  hours_expected double precision not null,
  labor_value double precision not null default 0
);
create index if not exists ticket_codes_ticket_idx on ticket_codes (ticket_id);

create table if not exists time_entries (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  employee_id text not null references employees(id),
  ticket_id text references tickets(id),
  kind text not null default 'work',
  clock_in timestamptz not null,
  clock_out timestamptz,
  clock_in_lat double precision,
  clock_in_lng double precision,
  clock_in_accuracy double precision,
  clock_out_lat double precision,
  clock_out_lng double precision,
  clock_out_accuracy double precision,
  clock_in_distance_ft double precision,
  clock_out_distance_ft double precision,
  billable_minutes double precision not null default 0,
  non_billable_minutes double precision not null default 0,
  gps_status text,
  device_info text,
  notes text,
  original_clock_in timestamptz,
  original_clock_out timestamptz,
  adjusted boolean not null default false,
  adjustment_reason text,
  approval_status text not null default 'pending',
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);
create index if not exists time_entries_emp_clock_idx on time_entries (employee_id, clock_in);
create index if not exists time_entries_ticket_idx on time_entries (ticket_id);
create index if not exists time_entries_open_idx on time_entries (employee_id) where clock_out is null;

create table if not exists timecards (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  employee_id text not null references employees(id),
  work_date date not null,
  status text not null default 'open',
  approved_by text,
  approved_at timestamptz,
  manager_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists timecards_emp_date_idx on timecards (employee_id, work_date);

create table if not exists gps_events (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  employee_id text not null references employees(id),
  ticket_id text references tickets(id),
  lat double precision not null,
  lng double precision not null,
  accuracy double precision,
  recorded_at timestamptz not null default now(),
  distance_ft double precision,
  status text not null,
  session_id text
);
create index if not exists gps_events_emp_time_idx on gps_events (employee_id, recorded_at desc);

create table if not exists exceptions (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  employee_id text not null references employees(id),
  ticket_id text references tickets(id),
  time_entry_id text references time_entries(id),
  kind text not null,
  severity text not null default 'warning',
  message text not null,
  status text not null default 'open',
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists exceptions_company_status_idx on exceptions (company_id, status, created_at desc);

create table if not exists parts (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  part_number text not null,
  manufacturer text not null,
  description text not null,
  category text not null,
  subcategory text not null,
  cost double precision not null default 0,
  sell_price double precision not null default 0,
  markup double precision not null default 0,
  vendor text,
  stock_qty integer not null default 0,
  warehouse_qty integer not null default 0,
  keywords text,
  aliases text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists parts_company_number_idx on parts (company_id, part_number);
create index if not exists parts_search_idx on parts (company_id, category, subcategory);

create table if not exists truck_inventory (
  id text primary key,
  employee_id text not null references employees(id) on delete cascade,
  vehicle text not null,
  part_id text not null references parts(id),
  quantity integer not null default 0,
  min_quantity integer not null default 1,
  updated_at timestamptz not null default now()
);
create unique index if not exists truck_inventory_emp_part_idx on truck_inventory (employee_id, part_id);

create table if not exists truck_movements (
  id text primary key,
  truck_inventory_id text not null references truck_inventory(id) on delete cascade,
  ticket_id text references tickets(id),
  qty_delta integer not null,
  reason text not null,
  created_at timestamptz not null default now(),
  created_by text
);

create table if not exists ticket_parts (
  id text primary key,
  ticket_id text not null references tickets(id) on delete cascade,
  part_id text not null references parts(id),
  quantity integer not null default 1,
  unit_cost double precision not null default 0,
  unit_price double precision not null default 0
);

create table if not exists audit_logs (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  actor_id text,
  actor_name text,
  action text not null,
  entity_type text not null,
  entity_id text,
  original_value text,
  new_value text,
  reason text,
  ticket_id text,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_company_time_idx on audit_logs (company_id, created_at desc);

create table if not exists api_keys (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  name text not null,
  key_hash text not null,
  key_prefix text not null,
  last_used_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by text
);

create table if not exists payroll_periods (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
