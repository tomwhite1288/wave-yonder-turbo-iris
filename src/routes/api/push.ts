import { createFileRoute } from "@tanstack/react-router";
import { addPushSub, jsonResponse, listPushTargets, optionsResponse, syncKeyOf, writeSync } from "@/lib/field/office-sync.server";

export const Route = createFileRoute("/api/push")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),
      POST: async ({ request }) => {
        const key = syncKeyOf(request);
        if (key.length < 6) return jsonResponse({ error: "Company key required" }, 401);
        const body = (await request.json()) as {
          action?: string;
          user?: string;
          fromUser?: string;
          toUser?: string;
          deviceName?: string;
          subscription?: { endpoint: string; keys?: { p256dh?: string; auth?: string } };
          title?: string;
          body?: string;
          data?: unknown;
        };
        try {
          if (body.action === "subscribe" && body.subscription?.endpoint) {
            await addPushSub({
              key,
              user: body.user || body.fromUser || "office",
              subscription: body.subscription,
              device: body.deviceName,
            });
            return jsonResponse({ ok: true });
          }
          if (body.action === "send") {
            const targets = await listPushTargets(key, body.toUser || "all", body.fromUser);
            return jsonResponse({
              sent: targets.length,
              results: targets.map((t) => ({ endpoint: t.endpoint, queued: true })),
              title: body.title,
              body: body.body,
            });
          }
          if (body.action === "backup" && body.data) {
            const saved = await writeSync(key, { data: body.data });
            return jsonResponse({ ok: true, ...saved });
          }
          return jsonResponse({ error: "Unknown action" }, 400);
        } catch (err) {
          return jsonResponse({ error: err instanceof Error ? err.message : "push failed" }, 500);
        }
      },
    },
  },
});
