import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Bell, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { listInbox, markAlertsRead, sendShopMessage } from "@/lib/field/api-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatClock } from "@/lib/utils";

export function InboxButtons({ timezone = "America/New_York" }: { timezone?: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["inbox"], queryFn: () => listInbox(), refetchInterval: 20_000 });
  const [open, setOpen] = useState<"chat" | "alerts" | null>(null);
  const [body, setBody] = useState("");
  const greeted = useRef(false);
  const send = useMutation({
    mutationFn: sendShopMessage,
    onSuccess: () => {
      setBody("");
      void qc.invalidateQueries({ queryKey: ["inbox"] });
    },
  });
  const unread = q.data?.unread ?? 0;
  const alertsUnread = q.data?.alerts.filter((a) => !a.read_at).length ?? 0;

  useEffect(() => {
    if (greeted.current || !q.data) return;
    greeted.current = true;
    if (q.data.unread > 0) {
      toast.message(`${q.data.unread} shop notification${q.data.unread === 1 ? "" : "s"}`);
    }
  }, [q.data]);

  return (
    <div className="relative flex items-center gap-1">
      <button
        type="button"
        className="relative grid size-11 place-items-center rounded-md text-muted hover:bg-elevated hover:text-fg"
        onClick={() => {
          setOpen(open === "alerts" ? null : "alerts");
          if (alertsUnread) void markAlertsRead().then(() => qc.invalidateQueries({ queryKey: ["inbox"] }));
        }}
        aria-label="Alerts"
      >
        <Bell className="size-4" />
        {alertsUnread > 0 ? (
          <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] text-fg">
            {alertsUnread}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        className="relative grid size-11 place-items-center rounded-md text-muted hover:bg-elevated hover:text-fg"
        onClick={() => setOpen(open === "chat" ? null : "chat")}
        aria-label="Shop chat"
      >
        <MessageSquare className="size-4" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-fg">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg md:absolute md:inset-auto md:right-0 md:top-12 md:h-[min(36rem,calc(100dvh-5rem))] md:w-[24rem] md:rounded-xl md:shadow-[var(--shadow-border)]">
          <div className="flex h-12 items-center justify-between border-b border-border px-3">
            <p className="text-sm font-semibold">{open === "alerts" ? "Alerts" : "Shop chat"}</p>
            <button type="button" className="grid size-10 place-items-center" onClick={() => setOpen(null)} aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
          {open === "alerts" ? (
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {(q.data?.alerts ?? []).length === 0 ? <p className="text-sm text-muted">No flags right now.</p> : null}
              {(q.data?.alerts ?? []).map((a) => (
                <div key={a.id} className="rounded-md bg-elevated px-3 py-2">
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-muted">{a.body}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {(q.data?.messages ?? []).length === 0 ? (
                  <p className="text-sm text-muted">No messages yet. This is shop-wide, saved on the server.</p>
                ) : null}
                {(q.data?.messages ?? []).map((m) => (
                  <div key={m.id} className="rounded-md bg-elevated px-3 py-2">
                    <div className="text-[11px] text-subtle">
                      {m.from_name} · {formatClock(m.created_at, timezone)}
                    </div>
                    <div className="text-sm">{m.body}</div>
                  </div>
                ))}
              </div>
              <form
                className="flex gap-2 border-t border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  send.mutate({ data: { body } });
                }}
              >
                <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message the shop" />
                <Button type="submit" size="sm" disabled={send.isPending || !body.trim()}>
                  Send
                </Button>
              </form>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
