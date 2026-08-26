-- Accountability: GPS-backed paid time, office geofence, receipts, claim rules.

alter table time_entries add column if not exists paid_minutes double precision not null default 0;
alter table time_entries add column if not exists unpaid_minutes double precision not null default 0;
alter table time_entries add column if not exists gps_backed boolean not null default false;

alter table ticket_parts add column if not exists receipt_cost double precision;
alter table ticket_parts add column if not exists vendor text;
alter table ticket_parts add column if not exists notes text;

create table if not exists job_receipts (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  ticket_id text not null references tickets(id) on delete cascade,
  employee_id text not null references employees(id),
  code text,
  amount double precision not null,
  vendor text,
  notes text,
  created_at timestamptz not null default now(),
  created_by text
);
create index if not exists job_receipts_ticket_idx on job_receipts (ticket_id, created_at desc);

insert into settings (company_id, key, value) values
  ('co_maichles', 'office_name', 'Shop / warehouse'),
  ('co_maichles', 'office_address', '105 J and M Drive'),
  ('co_maichles', 'office_city', 'New Castle'),
  ('co_maichles', 'office_state', 'DE'),
  ('co_maichles', 'office_zip', '19720'),
  ('co_maichles', 'office_lat', '39.662'),
  ('co_maichles', 'office_lng', '-75.566'),
  ('co_maichles', 'office_radius_ft', '200'),
  ('co_maichles', 'paid_kinds', '["travel","show","work","office"]'),
  ('co_maichles', 'require_gps_for_pay', 'true'),
  ('co_maichles', 'payroll_fed_pct', '10'),
  ('co_maichles', 'payroll_state_pct', '3.07'),
  ('co_maichles', 'payroll_fica_pct', '7.65'),
  ('co_maichles', 'parts_markup', '1.55')
on conflict (company_id, key) do nothing;
