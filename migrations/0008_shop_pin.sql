alter table employees add column if not exists username text;
alter table employees add column if not exists pin_hash text;
create unique index if not exists employees_company_username_idx
  on employees (company_id, lower(username))
  where username is not null and username <> '';
