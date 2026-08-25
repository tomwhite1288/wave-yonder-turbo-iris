import { createFileRoute } from "@tanstack/react-router";
import { authorizeIntegration, ticketAccountability } from "@/lib/field/integration.server";

export const Route = createFileRoute("/api/integration/tickets/$ticketNumber")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const companyId = await authorizeIntegration(request);
        if (!companyId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }
        const result = await ticketAccountability(companyId, params.ticketNumber);
        if (!result) {
          return new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
