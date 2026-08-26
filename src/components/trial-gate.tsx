import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserButton } from "@/lib/auth/gates";
import { redeemUnlockCode } from "@/lib/field/api-admin";
import type { TrialStatus } from "@/lib/field/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function TrialGate({
  trial,
  companyName,
}: {
  trial: TrialStatus;
  companyName: string;
}) {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () => redeemUnlockCode({ data: { code } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["profile"] });
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mut.mutate();
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 text-fg">
      <Card className="w-full max-w-md space-y-5 p-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-subtle">Field Ledger</p>
          <h1 className="text-xl font-semibold tracking-tight">Trial ended</h1>
          <p className="text-sm text-muted">
            {companyName} ran the {trial.trialDays}-day trial. Enter the shop unlock code to keep
            timecards, GPS pay, and payroll running on this site.
          </p>
        </div>
        <form className="space-y-3" onSubmit={submit}>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">Unlock code</span>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              placeholder="Shop license code"
            />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={mut.isPending || code.trim().length < 6}>
            {mut.isPending ? "Checking…" : "Unlock Field Ledger"}
          </Button>
        </form>
        <div className="flex justify-center pt-1">
          <UserButton />
        </div>
      </Card>
    </div>
  );
}

export function TrialBanner({ trial }: { trial: TrialStatus }) {
  if (!trial.enforced || trial.unlocked || trial.locked) return null;
  if (trial.daysLeft > 7) return null;
  return (
    <div className="border-b border-border bg-elevated px-4 py-2 text-center text-xs text-muted">
      Trial · {trial.daysLeft} day{trial.daysLeft === 1 ? "" : "s"} left. Unlock from Settings → Access.
    </div>
  );
}
