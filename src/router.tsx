import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { AppNotFound } from "@/lib/not-found";
import { routeTree } from "./routeTree.gen";

function Opening() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
      <div>
        <p className="text-lg font-semibold text-fg">Field Ledger</p>
        <p className="mt-2 text-sm text-muted">Opening the shop — this is not a deleted page.</p>
      </div>
    </div>
  );
}

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: AppNotFound,
    defaultPendingComponent: Opening,
    defaultPendingMinMs: 0,
  });
}