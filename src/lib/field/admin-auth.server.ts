import { createHash, timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";

export const DEFAULT_ADMIN_CODE = "EDGE-ADMIN";

export function normalizeAdminCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "-");
}

export function hashAdminCode(code: string): string {
  return createHash("sha256").update(normalizeAdminCode(code), "utf8").digest("hex");
}

function hashesMatch(stored: string, incoming: string): boolean {
  const a = Buffer.from(stored, "hex");
  const b = Buffer.from(incoming, "hex");
  if (a.length !== 32 || b.length !== 32 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function parseAdminEmails(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function readSetting(companyId: string, key: string): Promise<string | null> {
  const sql = await getSql();
  const rows = await sql<{ value: string }>`
    select value from settings where company_id = ${companyId} and key = ${key} limit 1
  `;
  return rows[0]?.value ?? null;
}

export async function writeSetting(companyId: string, key: string, value: string, userId?: string | null) {
  const sql = await getSql();
  await sql`
    insert into settings (company_id, key, value, updated_at, updated_by)
    values (${companyId}, ${key}, ${value}, now(), ${userId ?? null})
    on conflict (company_id, key) do update
      set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by
  `;
}

export async function ensureAdminCodeHash(companyId: string): Promise<string> {
  const existing = await readSetting(companyId, "admin_access_code_hash");
  if (existing) return existing;
  const hash = hashAdminCode(DEFAULT_ADMIN_CODE);
  await writeSetting(companyId, "admin_access_code_hash", hash, "system");
  const hint = await readSetting(companyId, "admin_code_hint");
  if (hint == null) await writeSetting(companyId, "admin_code_hint", "true", "system");
  return hash;
}

export async function adminHintVisible(companyId: string): Promise<boolean> {
  await ensureAdminCodeHash(companyId);
  const hint = await readSetting(companyId, "admin_code_hint");
  return hint !== "false";
}

export async function verifyAdminCode(companyId: string, code: string): Promise<boolean> {
  const normalized = normalizeAdminCode(code);
  if (normalized.length < 6 || normalized.length > 64) return false;
  const stored = await ensureAdminCodeHash(companyId);
  return hashesMatch(stored, hashAdminCode(normalized));
}

export async function listAdminEmails(companyId: string): Promise<string[]> {
  return parseAdminEmails(await readSetting(companyId, "admin_emails"));
}

export async function isListedAdminEmail(companyId: string, email: string | null | undefined): Promise<boolean> {
  const value = (email ?? "").trim().toLowerCase();
  if (!value) return false;
  const listed = await listAdminEmails(companyId);
  return listed.includes(value);
}

export async function addAdminEmail(companyId: string, email: string, userId?: string | null) {
  const value = email.trim().toLowerCase();
  if (!value || !value.includes("@")) return;
  const current = await listAdminEmails(companyId);
  if (current.includes(value)) return;
  await writeSetting(companyId, "admin_emails", [...current, value].join("\n"), userId);
}
