-- Company administrator access code (hashed) and auto-admin emails.
-- Default code EDGE-ADMIN until an administrator changes it in Settings.

insert into settings (company_id, key, value) values
  ('co_maichles', 'admin_access_code_hash', '178a2e9c25e0ec69bb6ed2f072c326af4c0f0734f0d5111803e3897c3c73b94d'),
  ('co_maichles', 'admin_code_hint', 'true'),
  ('co_maichles', 'admin_emails', '')
on conflict (company_id, key) do nothing;
