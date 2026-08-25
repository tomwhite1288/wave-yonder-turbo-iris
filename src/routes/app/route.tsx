import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getSessionProfile } from "@/lib/field/api";
import { claimAdministrator } from "@/lib/field/api-admin";
import { clearAdminCode, peekAdminCode } from "@/lib/field/admin-login";
import { AppShell } from "@/components/app-shell";
import { PendingGate, SignupClosed } from "@/components/pending-gate";
import { ThemeApplier } from "@/components/theme-applier";
import { toast } from "sonner";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const claimed = useRef(false);
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => getSessionProfile(),
    enabled: Boolean(user),
    retry: false,
  });

  const claim = useMutation({
    mutationFn: (code: string) => claimAdministrator({ data: { code } }),
    onSuccess: (res) => {
      clearAdminCode();
      if (!res.alreadyAdmin) toast.success("Administrator access granted");
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => {
      clearAdminCode();
      claimed.current = false;
      toast.error(e.message);
    },
  });

  useEffect(() => {
    if (!user || claimed.current) return;
    const code = peekAdminCode();
    if (!code) return;
    claimed.current = true;
    claim.mutate(code);
  }, [user]);

  if (isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-muted">
        <div className="h-8 w-40 animate-pulse rounded-md bg-elevated" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  if (profile.error) {
    const msg = profile.error.message || "Could not load this account";
    const closed = /turned off|sign-in is closed|approve your account/i.test(msg);
    return <SignupClosed title={closed ? "Sign-in is closed" : "Could not open Field Ledger"} message={msg} />;
  }

  const emp = profile.data?.employee;
  const settings = profile.data?.settings;
  const role = emp?.role ?? "technician";
  const name = emp?.name ?? user.displayName ?? "Field user";
  const isField = pathname.startsWith("/app/field");
  const unlocking = Boolean(peekAdminCode()) || claim.isPending || claim.isSuccess;

  if (emp && emp.accountStatus !== "active" && role !== "admin") {
    if (unlocking) {
      return (
        <div className="grid min-h-dvh place-items-center bg-bg text-muted">
          <p className="text-sm">Unlocking administrator access…</p>
        </div>
      );
    }
    return (
      <>
        <ThemeApplier theme={settings?.themeId} layout={settings?.layoutMode} />
        <PendingGate name={name} />
      </>
    );
  }

  return (
    <>
      <ThemeApplier theme={settings?.themeId} layout={settings?.layoutMode} />
      <AppShell role={role} name={name} tracking={isField} settings={settings}>
        {profile.isLoading ? (
          <div className="h-32 animate-pulse rounded-xl bg-surface" />
        ) : (
          <Outlet />
        )}
      </AppShell>
    </>
  );
}
