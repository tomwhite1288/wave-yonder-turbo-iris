alter table time_entries add column if not exists gps_confirm_until timestamptz;
alter table time_entries add column if not exists gps_confirm_status text;
alter table tickets add column if not exists job_kind text not null default 'service';

create table if not exists shop_messages (
  id text primary key,
  company_id text not null,
  from_id text not null,
  to_id text,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists shop_messages_co_idx on shop_messages (company_id, created_at desc);

create table if not exists shop_alerts (
  id text primary key,
  company_id text not null,
  employee_id text,
  kind text not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists shop_alerts_emp_idx on shop_alerts (company_id, employee_id, created_at desc);
