import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Radio } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { pinLogin, setupShopLogin, shopStatus } from "@/lib/field/api-admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: Login,
});

function Login() {
  const status = useQuery({
    queryKey: ["shop-status"],
    queryFn: () => shopStatus(),
    retry: false,
    staleTime: 15_000,
  });
  const [mode, setMode] = useState<"signin" | "activate">("activate");
  const showSetup = mode === "activate";
  const [name, setName] = useState("Pat Maichle");
  const [username, setUsername] = useState("pat");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [unlockCode, setUnlockCode] = useState("");
  const [techName, setTechName] = useState("John Rivera");
  const [techUser, setTechUser] = useState("john");
  const [techPin, setTechPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status.data?.needsSetup === false) setMode("signin");
    if (status.data?.needsSetup === true) setMode("activate");
  }, [status.data?.needsSetup]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (showSetup) {
        if (pin.length < 4) throw new Error("PIN must be at least 4 digits");
        if (pin !== pin2) throw new Error("PINs do not match");
        const staff = [];
        if (techUser && techPin.length >= 4) {
          staff.push({ role: "technician" as const, username: techUser, pin: techPin, name: techName || "Field Technician" });
        }
        await setupShopLogin({
          data: { username, pin, name: name || username, unlockCode: unlockCode.trim() || undefined, staff },
        });
      } else {
        await pinLogin({ data: { username, pin } });
      }
      try {
        window.localStorage.setItem("fl_shop_ready", "1");
      } catch {
        /* private mode */
      }
      window.location.replace("/app");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/dispatcher|useContext|useState|hydrat|abort/i.test(msg)) {
        window.location.replace("/app");
        return;
      }
      setError(msg || "Could not sign in");
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

        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={cn(
              "h-11 rounded-md text-sm font-medium",
              !showSetup ? "bg-primary text-primary-fg" : "bg-elevated text-muted",
            )}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={cn(
              "h-11 rounded-md text-sm font-medium",
              showSetup ? "bg-primary text-primary-fg" : "bg-elevated text-muted",
            )}
            onClick={() => setMode("activate")}
          >
            Activate shop
          </button>
        </div>

        <Card className="rounded-xl p-6">
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <div>
              <h1 className="text-lg font-semibold">{showSetup ? "Activate this shop" : "Sign in"}</h1>
              <p className="mt-1 text-sm text-muted">
                {showSetup
                  ? "First time on this copy: save an admin username and PIN. Add a field tech so dispatch has someone to assign."
                  : "Already set up: use the username and PIN the office assigned."}
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
              </>
            ) : null}
            {error ? <p className="rounded-md bg-elevated px-3 py-2 text-sm text-danger">{error}</p> : null}
            <Button className="h-11 w-full" disabled={busy} type="submit">
              {busy ? (showSetup ? "Saving shop…" : "Signing in…") : showSetup ? "Save office login" : "Continue"}
            </Button>
          </form>
        </Card>
        <p className="mt-6 text-center text-xs text-subtle">
          <Link to="/" className="hover:text-muted">
            Back
          </Link>
        </p>
        {status.data?.backend === "neon" || status.data?.durable ? (
          <p className="mt-3 text-center text-xs text-muted">Hosted shop database — dispatcher and field phones share tickets.</p>
        ) : null}
      </div>
    </main>
  );
}
