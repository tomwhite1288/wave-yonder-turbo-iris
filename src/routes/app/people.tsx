import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listPeople } from "@/lib/field/api";
import { assignShopPin, createShopUser, setAccountStatus, setEmployeeRole } from "@/lib/field/api-admin";
import type { Role } from "@/lib/field/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/spinner";

export const Route = createFileRoute("/app/people")({ ssr: false, component: PeoplePage });

function PeoplePage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["people"], queryFn: () => listPeople() });
  const statusMut = useMutation({
    mutationFn: setAccountStatus,
    onSuccess: () => {
      toast.success("Account updated");
      void qc.invalidateQueries({ queryKey: ["people"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const roleMut = useMutation({
    mutationFn: setEmployeeRole,
    onSuccess: () => {
      toast.success("Role updated");
      void qc.invalidateQueries({ queryKey: ["people"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const pinMut = useMutation({
    mutationFn: assignShopPin,
    onSuccess: () => {
      toast.success("PIN saved");
      void qc.invalidateQueries({ queryKey: ["people"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (q.isLoading) return <Spinner label="Loading people…" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { people, profile } = q.data!;
  const isAdmin = profile.employee.role === "admin";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <p className="text-sm text-muted">
          Create live logins, set roles, and assign each person a username and PIN. Demo roster rows can stay
          disabled.
        </p>
      </div>
      {isAdmin ? <CreateUserForm /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {people.map((p) => (
          <article key={p.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted">{p.employeeNumber} · {p.email}</div>
                <div className="text-xs text-subtle">Login: {p.username || "none yet"}</div>
              </div>
              <Badge tone={p.role === "admin" ? "info" : p.role === "manager" ? "warn" : "ok"}>{p.role}</Badge>
            </div>
            {p.accountStatus !== "active" ? (
              <p className="mt-2 text-xs text-warn">
                {p.accountStatus === "pending" ? "Waiting for administrator approval" : "Disabled"}
              </p>
            ) : null}
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-subtle">Department</div>
                {p.department}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-subtle">Classification</div>
                {p.laborClassification}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-subtle">Vehicle</div>
                {p.vehicle ?? "—"}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-subtle">Linked login</div>
                {p.userId ? "Yes" : "Pending"}
              </div>
            </div>
            {isAdmin ? (
              <>
                {p.accountStatus === "pending" || p.accountStatus === "disabled" ? (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => statusMut.mutate({ data: { employeeId: p.id, status: "active" } })}
                    >
                      Approve
                    </Button>
                    {p.accountStatus === "pending" ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => statusMut.mutate({ data: { employeeId: p.id, status: "disabled" } })}
                      >
                        Deny
                      </Button>
                    ) : null}
                  </div>
                ) : p.role !== "admin" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    onClick={() => statusMut.mutate({ data: { employeeId: p.id, status: "disabled" } })}
                  >
                    Disable sign-in
                  </Button>
                ) : null}
              <label className="mt-3 block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">Role</span>
                <select
                  className="h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm text-fg"
                  value={p.role}
                  disabled={roleMut.isPending}
                  onChange={(e) =>
                    roleMut.mutate({ data: { employeeId: p.id, role: e.target.value as Role } })
                  }
                >
                  <option value="admin">Administrator</option>
                  <option value="manager">Supervisor</option>
                  <option value="technician">Field technician</option>
                </select>
              </label>
              <PinForm
                employeeId={p.id}
                currentUsername={p.username ?? ""}
                busy={pinMut.isPending}
                onSave={(username, pin) => pinMut.mutate({ data: { employeeId: p.id, username, pin } })}
              />
              </>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function CreateUserForm() {
  const qc = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<Role>("technician");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const mut = useMutation({
    mutationFn: createShopUser,
    onSuccess: (res) => {
      toast.success(`Created ${res.employeeNumber}`);
      setFirstName("");
      setLastName("");
      setUsername("");
      setPin("");
      void qc.invalidateQueries({ queryKey: ["people"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card className="space-y-3 rounded-2xl p-5">
      <h2 className="text-sm font-semibold">Create user</h2>
      <p className="text-xs text-muted">Live login for admin, supervisor, office, or field tech. Saved on the server.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <Input placeholder="username" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input
          placeholder="PIN (4–8 digits)"
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
        />
        <select
          className="h-11 rounded-md border border-border bg-elevated px-3 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          <option value="technician">Field technician</option>
          <option value="manager">Supervisor / office</option>
          <option value="admin">Administrator</option>
        </select>
        <Button
          disabled={mut.isPending || !firstName.trim() || !lastName.trim() || !username.trim() || pin.length < 4}
          onClick={() => mut.mutate({ data: { firstName, lastName, role, username, pin } })}
        >
          {mut.isPending ? "Saving…" : "Add user"}
        </Button>
      </div>
    </Card>
  );
}

function PinForm({
  currentUsername,
  busy,
  onSave,
}: {
  employeeId: string;
  currentUsername: string;
  busy: boolean;
  onSave: (username: string, pin: string) => void;
}) {
  const [username, setUsername] = useState(currentUsername);
  const [pin, setPin] = useState("");
  return (
    <form
      className="mt-3 grid grid-cols-2 gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(username, pin);
        setPin("");
      }}
    >
      <Input
        placeholder="username"
        autoCapitalize="none"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <Input
        placeholder="PIN"
        type="password"
        inputMode="numeric"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
        required
      />
      <Button type="submit" size="sm" className="col-span-2" disabled={busy || !username || pin.length < 4}>
        Save username + PIN
      </Button>
    </form>
  );
}
