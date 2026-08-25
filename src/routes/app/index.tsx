import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSessionProfile } from "@/lib/field/api";
import { DispatchBoard } from "@/components/dispatch-board";

export const Route = createFileRoute("/app/")({ component: BoardPage });

function BoardPage() {
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => getSessionProfile() });
  if (profile.data?.employee.role === "technician") {
    return <Navigate to="/app/field" />;
  }
  if (profile.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (profile.error) return <p className="text-sm text-danger">{profile.error.message}</p>;
  return <DispatchBoard />;
}
