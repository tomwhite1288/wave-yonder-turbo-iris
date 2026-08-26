import { timingSafeEqual } from "node:crypto";
import { hashAdminCode, writeSetting } from "./admin-auth.server";
import { currentDbSource } from "@/lib/db";
import type { CompanySettings, TrialStatus } from "./types";

/** Shop license code. Override on Netlify with FIELD_UNLOCK_CODE. */
export const DEFAULT_UNLOCK_CODE = "EDGE-LEDGER-2026";
const DEFAULT_TRIAL_DAYS = 7;

export function unlockCodeExpected(): string {
  const env = (typeof process !== "undefined" ? process.env.FIELD_UNLOCK_CODE : "")?.trim();
  return env && env.length >= 6 ? env : DEFAULT_UNLOCK_CODE;
}

export function trialEnforced(): boolean {
  if (typeof process === "undefined") return false;
  if (process.env.NETLIFY === "true" || process.env.NETLIFY === "1") return true;
  return currentDbSource() === "neon";
}

export function verifyUnlockCode(code: string, storedHash?: string | null): boolean {
  const incoming = hashAdminCode(code);
  const expected = hashAdminCode(unlockCodeExpected());
  const a = Buffer.from(incoming, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length === 32 && b.length === 32 && timingSafeEqual(a, b)) return true;
  if (!storedHash || storedHash.length !== 64) return false;
  const c = Buffer.from(storedHash, "hex");
  return c.length === 32 && a.length === 32 && timingSafeEqual(a, c);
}

export function computeTrial(s: CompanySettings): TrialStatus {
  const enforced = trialEnforced();
  const started = Date.parse(s.trialStartedAt) || Date.now();
  const days = Math.max(0, s.trialDays || DEFAULT_TRIAL_DAYS);
  const ends = started + days * 86400000;
  const daysLeft = Math.max(0, Math.ceil((ends - Date.now()) / 86400000));
  const unlocked = s.trialUnlocked;
  const locked = enforced && !unlocked && (days === 0 || Date.now() > ends);
  return {
    enforced,
    unlocked,
    startedAt: new Date(started).toISOString(),
    endsAt: new Date(ends).toISOString(),
    trialDays: days,
    daysLeft: unlocked ? 0 : daysLeft,
    locked,
  };
}

export async function stampTrialStart(companyId: string, startedAt: string) {
  await writeSetting(companyId, "trial_started_at", startedAt, "system");
  await writeSetting(companyId, "trial_days", String(DEFAULT_TRIAL_DAYS), "system");
  await writeSetting(companyId, "trial_unlocked", "false", "system");
}

export { DEFAULT_TRIAL_DAYS };
