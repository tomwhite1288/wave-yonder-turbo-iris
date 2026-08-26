-- Office computer sync + push subscriptions (Netlify / local python mirror).
-- Also re-apply accountability columns if 0006 was added while the preview was already up.

alter table time_entries add column if not exists paid_minutes double precision not null default 0;
alter table time_entries add column if not exists unpaid_minutes double precision not null default 0;
alter table time_entries add column if not exists gps_backed boolean not null default false;

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

create table if not exists office_sync (
  sync_key text primary key,
  rev integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  actor text,
  updated_at timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id text primary key,
  sync_key text not null,
  user_label text not null,
  endpoint text not null,
  p256dh text,
  auth_secret text,
  device text,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_key_idx on push_subscriptions (sync_key, user_label);

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
  ('co_maichles', 'payroll_fica_pct', '7.65')
on conflict (company_id, key) do nothing;
