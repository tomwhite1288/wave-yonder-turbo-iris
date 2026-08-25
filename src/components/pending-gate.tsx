import { UserButton } from "@/lib/auth/gates";
import { Card } from "@/components/ui/card";

export function PendingGate({ name }: { name: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 text-fg">
      <Card className="w-full max-w-md space-y-4 p-6 text-center">
        <p className="text-xs uppercase tracking-wide text-subtle">Field Ledger</p>
        <h1 className="text-xl font-semibold tracking-tight">Waiting for approval</h1>
        <p className="text-sm text-muted">
          {name}, your login is on file. An administrator has to approve this account before you can open jobs, the
          clock, or the dispatch desk.
        </p>
        <div className="flex justify-center pt-2">
          <UserButton />
        </div>
      </Card>
    </div>
  );
}

export function SignupClosed({ title, message }: { title?: string; message: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 text-fg">
      <Card className="w-full max-w-md space-y-4 p-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight">{title ?? "Sign-in is closed"}</h1>
        <p className="text-sm text-muted">{message}</p>
        <div className="flex justify-center pt-2">
          <UserButton />
        </div>
      </Card>
    </div>
  );
}
