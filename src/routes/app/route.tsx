import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getSessionProfile } from "@/lib/field/api";
import { claimAdministrator } from "@/lib/field/api-admin";
import { clearAdminCode, peekAdminCode } from "@/lib/field/admin-login";
import { AppShell } from "@/components/app-shell";
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

  const role = profile.data?.employee.role ?? "technician";
  const name = profile.data?.employee.name ?? user.displayName ?? "Field user";
  const isField = pathname.startsWith("/app/field");

  return (
    <AppShell role={role} name={name} tracking={isField}>
      {profile.isLoading ? (
        <div className="h-32 animate-pulse rounded-xl bg-surface" />
      ) : profile.error ? (
        <p className="text-sm text-danger">{profile.error.message}</p>
      ) : (
        <Outlet />
      )}
    </AppShell>
  );
}
