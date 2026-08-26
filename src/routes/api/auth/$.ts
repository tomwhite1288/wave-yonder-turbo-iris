import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { trustThisRequest } from "@/lib/field/stock-admin.server";

function handle(request: Request) {
  trustThisRequest(request);
  return auth.handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
