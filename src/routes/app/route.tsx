import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { getSessionProfile } from "@/lib/field/api";
import { AppShell } from "@/components/app-shell";
import { PendingGate, SignupClosed } from "@/components/pending-gate";
import { ThemeApplier } from "@/components/theme-applier";
import { Spinner } from "@/components/spinner";
import { TrialBanner, TrialGate } from "@/components/trial-gate";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => getSessionProfile(),
    retry: false,
    staleTime: 8_000,
  });

  if (profile.isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
        <div>
          <Spinner label="Opening Field Ledger…" />
          <p className="mt-6 text-sm text-muted">If this never finishes, the shop login cookie did not stick. Sign in again.</p>
          <Button asChild variant="secondary" className="mt-4">
            <Link to="/login">Back to sign-in</Link>
          </Button>
        </div>
      </div>
    );
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
