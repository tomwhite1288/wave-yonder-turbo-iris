import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { claimAdministrator, getAdminLoginMeta } from "@/lib/field/api-admin";
import { clearAdminCode } from "@/lib/field/admin-login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminCodeFields({
  code,
  onChange,
  hint,
}: {
  code: string;
  onChange: (value: string) => void;
  hint: string | null;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium uppercase tracking-wide text-subtle">
        Administrator access code
      </span>
      <Input
        type="password"
        autoComplete="off"
        placeholder="Company admin code"
        value={code}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={6}
      />
      {hint ? (
        <p className="text-xs text-muted">
          Factory code until you change it in Settings:{" "}
          <span className="font-mono text-fg">{hint}</span>
        </p>
      ) : (
        <p className="text-xs text-muted">Use the code set in Settings → Administrator access.</p>
      )}
    </label>
  );
}

export function useAdminLoginMeta() {
  return useQuery({
    queryKey: ["admin-login-meta"],
    queryFn: () => getAdminLoginMeta(),
    staleTime: 30_000,
  });
}

export function UnlockAdminForm({ onUnlocked }: { onUnlocked?: () => void }) {
  const qc = useQueryClient();
  const meta = useAdminLoginMeta();
  const [code, setCode] = useState("");
  const mut = useMutation({
    mutationFn: (value: string) => claimAdministrator({ data: { code: value } }),
    onSuccess: (res) => {
      clearAdminCode();
      toast.success(res.alreadyAdmin ? "Administrator already unlocked" : "Administrator access granted");
      void qc.invalidateQueries({ queryKey: ["profile"] });
      void qc.invalidateQueries({ queryKey: ["settings"] });
      onUnlocked?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    mut.mutate(code);
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <AdminCodeFields code={code} onChange={setCode} hint={meta.data?.defaultCode ?? null} />
      <Button type="submit" className="w-full" disabled={mut.isPending || code.trim().length < 6}>
        {mut.isPending ? "Checking…" : "Unlock administrator"}
      </Button>
    </form>
  );
}

export function GateChoice({
  title,
  body,
  icon,
  onClick,
  primary,
}: {
  title: string;
  body: string;
  icon: ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? "flex w-full items-start gap-3 rounded-xl bg-primary px-4 py-4 text-left text-primary-fg transition-opacity hover:opacity-90"
          : "flex w-full items-start gap-3 rounded-xl bg-elevated px-4 py-4 text-left text-fg shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)]"
      }
    >
      <span className="mt-0.5 grid size-10 place-items-center rounded-lg bg-bg/15">{icon}</span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className={`mt-0.5 block text-sm ${primary ? "text-primary-fg/80" : "text-muted"}`}>{body}</span>
      </span>
    </button>
  );
}

export function AdminMark() {
  return <ShieldCheck className="size-5" />;
}
