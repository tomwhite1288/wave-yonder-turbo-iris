import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { HardHat, Radio, ShieldCheck } from "lucide-react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AdminCodeFields, AdminMark, GateChoice, UnlockAdminForm, useAdminLoginMeta } from "@/components/admin-gate";
import { stashAdminCode, clearAdminCode } from "@/lib/field/admin-login";

type Gate = "pick" | "field" | "admin";
type LoginSearch = { mode?: "admin" };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): LoginSearch =>
    s.mode === "admin" ? { mode: "admin" } : {},
  component: Login,
});

function Login() {
  const search = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const [gate, setGate] = useState<Gate>(search.mode === "admin" ? "admin" : "pick");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const meta = useAdminLoginMeta();

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (gate === "admin") {
      if (adminCode.trim().length < 6) {
        setError("Enter the administrator access code first");
        return;
      }
      stashAdminCode(adminCode);
    } else {
      clearAdminCode();
    }
    setBusy(true);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0] || "Field user",
          callbackURL: gate === "admin" ? "/app?admin=1" : "/app",
        });
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await authClient.signIn.email({
          email,
          password,
          callbackURL: gate === "admin" ? "/app?admin=1" : "/app",
        });
        if (err) throw new Error(err.message);
      }
      window.location.href = gate === "admin" ? "/app?admin=1" : "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  function startProvider(providerId: string) {
    if (gate === "admin") {
      if (adminCode.trim().length < 6) {
        setError("Enter the administrator access code first");
        return;
      }
      stashAdminCode(adminCode);
    } else {
      clearAdminCode();
    }
    void signIn(providerId, { callbackURL: gate === "admin" ? "/app?admin=1" : "/app" });
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-md stagger-in">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-surface text-primary shadow-[var(--shadow-border)]">
            <Radio className="size-5" />
          </span>
          <div>
            <div className="text-xl font-semibold tracking-tight">Field Ledger</div>
            <div className="text-sm text-muted">Maichle's Edge companion</div>
          </div>
        </div>
        <Card className="rounded-2xl p-5">
          {gate === "pick" ? (
            <>
              <h1 className="text-lg font-semibold">Who is signing in?</h1>
              <p className="mt-1 text-sm text-muted">
                Administrators unlock the board, payroll, and settings. Field team clocks in against assigned tickets.
              </p>
              <div className="mt-5 space-y-3">
                <GateChoice
                  primary
                  title="Administrator"
                  body="Office, payroll, code book, and company controls"
                  icon={<AdminMark />}
                  onClick={() => setGate("admin")}
                />
                <GateChoice
                  title="Field team"
                  body="Technicians and managers — Google, X, or work email"
                  icon={<HardHat className="size-5" />}
                  onClick={() => {
                    clearAdminCode();
                    setGate("field");
                  }}
                />
              </div>
            </>
          ) : gate === "admin" ? (
            <>
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="size-4" />
                <p className="text-xs font-medium uppercase tracking-wide">Administrator</p>
              </div>
              <h1 className="mt-2 text-lg font-semibold">Company admin sign-in</h1>
              <p className="mt-1 text-sm text-muted">
                Enter the access code, then sign in with Google, X, or email. That account becomes an administrator — even
                if it was created as a technician.
              </p>
              {isPending ? (
                <div className="mt-5 h-24 animate-pulse rounded-lg bg-elevated" />
              ) : (
                <>
                  <SignedIn>
                    <div className="mt-5">
                      <p className="mb-3 text-sm text-muted">
                        Signed in as {user?.primaryEmail || user?.displayName || "this account"}. Unlock admin on this login.
                      </p>
                      <UnlockAdminForm onUnlocked={() => { window.location.href = "/app"; }} />
                    </div>
                  </SignedIn>
                  <SignedOut>
                    {authEnabled ? (
                      <div className="mt-5 space-y-3">
                        <AdminCodeFields
                          code={adminCode}
                          onChange={(v) => {
                            setAdminCode(v);
                            setError(null);
                          }}
                          hint={meta.data?.defaultCode ?? null}
                        />
                        {GROK_PROVIDERS.map((p) => (
                          <Button
                            key={p.providerId}
                            type="button"
                            variant="secondary"
                            className="w-full"
                            disabled={adminCode.trim().length < 6}
                            onClick={() => startProvider(p.providerId)}
                          >
                            Continue with {p.label}
                          </Button>
                        ))}
                        <div className="flex items-center gap-3 py-1 text-[11px] uppercase tracking-wide text-subtle">
                          <span className="h-px flex-1 bg-border" />
                          or email
                          <span className="h-px flex-1 bg-border" />
                        </div>
                        <form className="space-y-3" onSubmit={onEmail}>
                          {mode === "up" ? (
                            <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                          ) : null}
                          <Input
                            type="email"
                            placeholder="Work email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                          />
                          <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete={mode === "up" ? "new-password" : "current-password"}
                            required
                            minLength={8}
                          />
                          {error ? <p className="text-sm text-danger">{error}</p> : null}
                          <Button type="submit" className="w-full" disabled={busy}>
                            {busy ? "Working…" : mode === "up" ? "Create admin account" : "Sign in as administrator"}
                          </Button>
                        </form>
                        <button
                          type="button"
                          className="w-full text-center text-sm text-muted hover:text-fg"
                          onClick={() => setMode(mode === "up" ? "in" : "up")}
                        >
                          {mode === "up" ? "Already have an account? Sign in" : "Need an account? Create one"}
                        </button>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted">Sign-in is disabled.</p>
                    )}
                  </SignedOut>
                </>
              )}
              <button type="button" className="mt-4 text-sm text-muted hover:text-fg" onClick={() => setGate("pick")}>
                Back to sign-in choices
              </button>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold">Field team sign-in</h1>
              <p className="mt-1 text-sm text-muted">
                Roster emails match existing employees. New logins wait for administrator approval before they can clock in.
              </p>
              {authEnabled ? (
                <div className="mt-5 space-y-3">
                  {GROK_PROVIDERS.map((p) => (
                    <Button
                      key={p.providerId}
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() => startProvider(p.providerId)}
                    >
                      Continue with {p.label}
                    </Button>
                  ))}
                  <div className="flex items-center gap-3 py-1 text-[11px] uppercase tracking-wide text-subtle">
                    <span className="h-px flex-1 bg-border" />
                    or email
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <form className="space-y-3" onSubmit={onEmail}>
                    {mode === "up" ? (
                      <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                    ) : null}
                    <Input
                      type="email"
                      placeholder="Work email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "up" ? "new-password" : "current-password"}
                      required
                      minLength={8}
                    />
                    {error ? <p className="text-sm text-danger">{error}</p> : null}
                    <Button type="submit" className="w-full" disabled={busy}>
                      {busy ? "Working…" : mode === "up" ? "Create account" : "Sign in"}
                    </Button>
                  </form>
                  <button
                    type="button"
                    className="w-full text-center text-sm text-muted hover:text-fg"
                    onClick={() => setMode(mode === "up" ? "in" : "up")}
                  >
                    {mode === "up" ? "Already have an account? Sign in" : "Need an account? Create one"}
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted">Sign-in is disabled.</p>
              )}
              <button type="button" className="mt-4 text-sm text-muted hover:text-fg" onClick={() => setGate("pick")}>
                Back to sign-in choices
              </button>
            </>
          )}
        </Card>
        <p className="mt-4 text-center text-xs text-subtle">
          Independent of the primary ticket platform.{" "}
          <Link to="/" className="text-muted underline-offset-4 hover:underline">
            Back
          </Link>
        </p>
      </div>
    </main>
  );
}
