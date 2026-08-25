import { createFileRoute } from "@tanstack/react-router";
import { authorizeIntegration, ingestTicket, type InboundTicket } from "@/lib/field/integration.server";

export const Route = createFileRoute("/api/integration/tickets")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const companyId = await authorizeIntegration(request);
        if (!companyId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }
        try {
          const payload = (await request.json()) as InboundTicket;
          const result = await ingestTicket(companyId, payload);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Bad request" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
