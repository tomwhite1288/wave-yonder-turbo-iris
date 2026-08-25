-- Dispatch desk, code books, account approval, layout/theme settings.
-- Demo tickets/codes are stripped so beta import is the source of truth.

alter table code_book add column if not exists book text not null default 'invoice';
alter table code_book add column if not exists parts_allowance double precision not null default 0;
alter table tickets add column if not exists work_detail text;
alter table employees add column if not exists account_status text not null default 'active';

insert into settings (company_id, key, value) values
  ('co_maichles', 'theme_id', 'stock'),
  ('co_maichles', 'layout_mode', 'auto'),
  ('co_maichles', 'dispatch_show_map', 'true'),
  ('co_maichles', 'dispatch_show_tiles', 'false'),
  ('co_maichles', 'signup_open', 'true'),
  ('co_maichles', 'signup_requires_approval', 'true'),
  ('co_maichles', 'mobile_dock', '["field","jobs","timecards","codes","parts"]'),
  ('co_maichles', 'role_nav', '{}'),
  ('co_maichles', 'hydrated_day', 'off')
on conflict (company_id, key) do nothing;

-- One-time wipe of sandbox demo jobs and stub codes (cb_*). Parts catalog stays.
delete from gps_events where ticket_id like 'tkt_%' or session_id like 'sess_%';
delete from truck_movements where ticket_id like 'tkt_%';
delete from exceptions where id like 'ex_%' or ticket_id like 'tkt_%';
delete from time_entries where id like 'te_%' or ticket_id like 'tkt_%';
delete from ticket_codes where ticket_id like 'tkt_%';
delete from ticket_parts where ticket_id like 'tkt_%';
delete from tickets where id like 'tkt_%';
delete from code_book where id like 'cb_%';

-- Same code may exist in invoice, plumbing, and HVAC books.
drop index if exists code_book_company_code_idx;
create unique index if not exists code_book_company_book_code_idx on code_book (company_id, book, code);
