import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Radio } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { pinLogin, setupShopLogin, shopStatus } from "@/lib/field/api-admin";

export const Route = createFileRoute("/login")({
  component: Login,
});

async function loadShopStatus() {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("status-timeout")), 4000);
  });
  return Promise.race([shopStatus(), timeout]);
}

function Login() {
  const status = useQuery({
    queryKey: ["shop-status"],
    queryFn: loadShopStatus,
    retry: false,
    staleTime: 15_000,
  });
  const [firstRun, setFirstRun] = useState(false);
  const showSetup = firstRun || Boolean(status.data?.needsSetup);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [unlockCode, setUnlockCode] = useState("");
  const [techName, setTechName] = useState("");
  const [techUser, setTechUser] = useState("");
  const [techPin, setTechPin] = useState("");
  const [mgrName, setMgrName] = useState("");
  const [mgrUser, setMgrUser] = useState("");
  const [mgrPin, setMgrPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (showSetup) {
        if (pin !== pin2) throw new Error("PINs do not match");
        const staff = [];
        if (mgrUser && mgrPin.length >= 4) {
          staff.push({ role: "manager" as const, username: mgrUser, pin: mgrPin, name: mgrName || "Office Supervisor" });
        }
        if (techUser && techPin.length >= 4) {
          staff.push({ role: "technician" as const, username: techUser, pin: techPin, name: techName || "Field Technician" });
        }
        await setupShopLogin({ data: { username, pin, name, unlockCode: unlockCode.trim() || undefined, staff } });
      } else {
        await pinLogin({ data: { username, pin } });
      }
      window.location.assign("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-surface text-primary shadow-[var(--shadow-border)]">
            <Radio className="size-4" />
          </span>
          <div>
            <div className="text-base font-semibold tracking-tight">Field Ledger</div>
            <div className="text-xs text-muted">Maichle's Edge</div>
          </div>
        </div>

        <Card className="rounded-xl p-6">
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <div>
              <h1 className="text-lg font-semibold">{showSetup ? "Activate this shop" : "Sign in"}</h1>
              <p className="mt-1 text-sm text-muted">
                {showSetup
                  ? "Save the administrator username and PIN. Without an activation code this copy runs a 7-day demo. Add a field tech now so the dispatch board has someone to assign."
                  : "Use the username and PIN the office assigned you."}
              </p>
            </div>
            {showSetup ? (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted">Administrator name</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Pat Maichle" />
              </label>
            ) : null}
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted">{showSetup ? "Admin username" : "Username"}</span>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" required />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted">PIN</span>
              <Input
                type="password"
                inputMode="numeric"
                autoComplete={showSetup ? "new-password" : "current-password"}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                required
              />
            </label>
            {showSetup ? (
              <>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted">Confirm PIN</span>
                  <Input
                    type="password"
                    inputMode="numeric"
                    value={pin2}
                    onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    required
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted">Activation code (optional)</span>
                  <Input
                    value={unlockCode}
                    onChange={(e) => setUnlockCode(e.target.value)}
                    autoComplete="off"
                    placeholder="Leave blank for 7-day demo"
                  />
                </label>
                <div className="space-y-2 rounded-lg bg-elevated p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-subtle">Field tech (needed for the board)</p>
                  <Input placeholder="Name" value={techName} onChange={(e) => setTechName(e.target.value)} />
                  <Input placeholder="username" autoCapitalize="none" value={techUser} onChange={(e) => setTechUser(e.target.value)} />
                  <Input
                    placeholder="PIN"
                    type="password"
                    inputMode="numeric"
                    value={techPin}
                    onChange={(e) => setTechPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  />
                </div>
                <div className="space-y-2 rounded-lg bg-elevated p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-subtle">Optional supervisor / office</p>
                  <Input placeholder="Name" value={mgrName} onChange={(e) => setMgrName(e.target.value)} />
                  <Input placeholder="username" autoCapitalize="none" value={mgrUser} onChange={(e) => setMgrUser(e.target.value)} />
                  <Input
                    placeholder="PIN"
                    type="password"
                    inputMode="numeric"
                    value={mgrPin}
                    onChange={(e) => setMgrPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  />
                </div>
              </>
            ) : null}
            {error ? <p className="rounded-md bg-elevated px-3 py-2 text-sm text-danger">{error}</p> : null}
            <Button className="h-11 w-full" disabled={busy} type="submit">
              {busy ? "Working…" : showSetup ? "Save office login" : "Continue"}
            </Button>
          </form>
        </Card>
        <p className="mt-6 text-center text-xs text-subtle">
          {status.isSuccess && !status.data?.needsSetup ? (
            <button type="button" className="hover:text-muted" onClick={() => setFirstRun(true)}>
              First time on this copy? Activate
            </button>
          ) : (
            <button type="button" className="hover:text-muted" onClick={() => setFirstRun(false)}>
              Already activated? Sign in
            </button>
          )}
          {" · "}
          <Link to="/" className="hover:text-muted">
            Back
          </Link>
        </p>
      </div>
    </main>
  );
}
