import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, optionsResponse, readSync, syncKeyOf, writeSync } from "@/lib/field/office-sync.server";

export const Route = createFileRoute("/api/sync")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),
      GET: async ({ request }) => {
        const key = syncKeyOf(request);
        if (key.length < 6) return jsonResponse({ error: "Company key required" }, 401);
        try {
          return jsonResponse(await readSync(key));
        } catch (err) {
          return jsonResponse({ error: err instanceof Error ? err.message : "sync failed" }, 500);
        }
      },
      PUT: async ({ request }) => {
        const key = syncKeyOf(request);
        if (key.length < 6) return jsonResponse({ error: "Company key required" }, 401);
        try {
          const body = (await request.json()) as { rev?: number; data?: unknown };
          return jsonResponse(await writeSync(key, body));
        } catch (err) {
          return jsonResponse({ error: err instanceof Error ? err.message : "sync failed" }, 500);
        }
      },
    },
  },
});
