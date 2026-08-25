export const ADMIN_CODE_KEY = "field-ledger.admin-code";

export function stashAdminCode(code: string) {
  const value = code.trim();
  if (typeof window === "undefined" || !value) return;
  try {
    window.sessionStorage.setItem(ADMIN_CODE_KEY, value);
  } catch {
    /* ignore */
  }
}

export function peekAdminCode(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(ADMIN_CODE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function clearAdminCode() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ADMIN_CODE_KEY);
  } catch {
    /* ignore */
  }
}
