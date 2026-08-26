import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { getSessionProfile } from "@/lib/field/api";
import { AppShell } from "@/components/app-shell";
import { PendingGate, SignupClosed } from "@/components/pending-gate";
import { ThemeApplier } from "@/components/theme-applier";
import { Spinner } from "@/components/spinner";
import { TrialBanner, TrialGate } from "@/components/trial-gate";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => getSessionProfile(),
    retry: false,
  });

  if (profile.isPending) {
    return <Spinner label="Opening Field Ledger…" />;
  }
  if (profile.error) return <RedirectToSignIn />;

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
