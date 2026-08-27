import { Link } from "@tanstack/react-router";

export function AppNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Field Ledger</p>
      <h1 className="text-xl font-semibold">That page is not in this app</h1>
      <p className="max-w-md text-sm text-muted">
        Open the home screen, sign in, or the phone code book. Extra folders on the Mac are not routes.
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        <Link to="/" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-fg">
          Home
        </Link>
        <a
          href="/Maichles-Code-Book.html"
          className="rounded-md bg-surface px-4 py-2 text-sm font-semibold text-fg shadow-[var(--shadow-border)]"
        >
          Phone code book
        </a>
      </div>
    </main>
  );
}
