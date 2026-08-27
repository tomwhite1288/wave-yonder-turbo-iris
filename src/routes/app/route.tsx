import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSessionProfile } from "@/lib/field/api";
import { AppShell } from "@/components/app-shell";
import { PendingGate, SignupClosed } from "@/components/pending-gate";
import { ThemeApplier } from "@/components/theme-applier";
import { Spinner } from "@/components/spinner";
import { TrialBanner, TrialGate } from "@/components/trial-gate";

export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => getSessionProfile(),
    retry: 1,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  if (profile.isPending && !profile.data) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
        <Spinner label="Opening Field Ledger…" />
      </div>
    );
  }

  if (profile.error && !profile.data) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
        <div className="max-w-sm space-y-3">
          <p className="text-lg font-semibold">Session dropped</p>
          <p className="text-sm text-muted">
            The office login is still on this shop. Sign in again — you should not have to activate a second time.
          </p>
          <Link to="/login" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const emp = profile.data?.employee;
  const settings = profile.data?.settings;
  const role = emp?.role ?? "technician";
  const name = emp?.name ?? "Field user";

  if (emp && emp.accountStatus !== "active" && role !== "admin") {
    return (
      <>
        <ThemeApplier theme={settings?.themeId} layout={settings?.layoutMode} />
        <PendingGate name={name} />
      </>
    );
  }

  if (profile.data?.trial.locked) {
    return (
      <>
        <ThemeApplier theme={settings?.themeId} layout={settings?.layoutMode} />
        <TrialGate trial={profile.data.trial} companyName="Maichle's Edge" />
      </>
    );
  }

  if (!emp) {
    return <SignupClosed title="Could not open Field Ledger" message="No employee profile on this login." />;
  }

  return (
    <>
      <ThemeApplier theme={settings?.themeId} layout={settings?.layoutMode} />
      <AppShell role={role} name={name} tracking={false} settings={settings}>
        {profile.data.trial.enforced && !profile.data.trial.unlocked ? <TrialBanner trial={profile.data.trial} /> : null}
        <Outlet />
      </AppShell>
    </>
  );
}
