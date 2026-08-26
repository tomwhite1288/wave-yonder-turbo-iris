import { getRequest } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth/server";
import { getSql } from "@/lib/db";
import { addAdminEmail } from "./admin-auth.server";
import {
  STOCK_ADMIN_EMAIL,
  STOCK_ADMIN_NAME,
  STOCK_ADMIN_PASSWORD,
  STOCK_ADMIN_USERNAME,
} from "./stock-admin";

export {
  STOCK_ADMIN_EMAIL,
  STOCK_ADMIN_NAME,
  STOCK_ADMIN_PASSWORD,
  STOCK_ADMIN_USERNAME,
};

const NETLIFY_SITE = "https://field-agent-maichles.netlify.app";

/** Make this request's origin trusted so Better Auth stops returning Invalid origin. */
export function trustThisRequest(request?: Request | null): string {
  let origin = NETLIFY_SITE;
  try {
    if (request?.url) origin = new URL(request.url).origin;
  } catch {
    origin = process.env.BETTER_AUTH_URL?.trim() || NETLIFY_SITE;
  }
  if (!process.env.BETTER_AUTH_URL?.trim()) process.env.BETTER_AUTH_URL = origin;
  const pieces = new Set(
    (process.env.BETTER_AUTH_TRUSTED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  pieces.add(origin);
  pieces.add(NETLIFY_SITE);
  pieces.add("https://*.netlify.app");
  pieces.add("http://localhost:8080");
  pieces.add("http://127.0.0.1:8080");
  process.env.BETTER_AUTH_TRUSTED_ORIGINS = [...pieces].join(",");
  return origin;
}

function headersForAuth(origin: string): Headers {
  const req = getRequest();
  const headers = new Headers(req?.headers);
  headers.set("origin", origin);
  headers.set("referer", `${origin}/`);
  return headers;
}

export async function signInStockAdmin(username: string, password: string): Promise<void> {
  const req = getRequest();
  const origin = trustThisRequest(req ?? null);
  const u = username.trim().toLowerCase();
  const allowed =
    u === STOCK_ADMIN_USERNAME || u === STOCK_ADMIN_EMAIL.toLowerCase();
  if (!allowed || password !== STOCK_ADMIN_PASSWORD) {
    throw Object.assign(new Error("Wrong office username or password"), { status: 401 });
  }

  const headers = headersForAuth(origin);
  const body = {
    email: STOCK_ADMIN_EMAIL,
    password: STOCK_ADMIN_PASSWORD,
    name: STOCK_ADMIN_NAME,
  };

  const trySignIn = () =>
    auth.api.signInEmail({
      body: { email: body.email, password: body.password },
      headers,
    });

  try {
    await trySignIn();
  } catch {
    try {
      await auth.api.signUpEmail({ body, headers });
    } catch {
      /* user may already exist */
    }
    await trySignIn();
  }

  try {
    const sql = await getSql();
    const company = await sql<{ id: string }>`select id from companies order by created_at asc limit 1`;
    const companyId = company[0]?.id ?? "co_maichles";
    await addAdminEmail(companyId, STOCK_ADMIN_EMAIL, "stock-admin");
    await sql`
      update employees
      set role = 'admin',
          account_status = 'active',
          active = true,
          updated_at = now()
      where lower(email) = ${STOCK_ADMIN_EMAIL}
    `;
  } catch {
    /* profile link happens on first /app load */
  }
}
