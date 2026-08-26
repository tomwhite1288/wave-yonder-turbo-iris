import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

/** Phone copy is one HTML file hosted on the shop site — not a multi-file app. */
const BOOK_FILE = "/Maichles-Code-Book.html";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Code Book" },
      { name: "description", content: "One-file HVAC and plumbing code lookup for the truck." },
    ],
  }),
  component: PhoneBookRedirect,
});

function PhoneBookRedirect() {
  useEffect(() => {
    window.location.replace(BOOK_FILE);
  }, []);
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">Maichle's Edge</p>
        <h1 className="mt-1 text-lg font-semibold">Code Book</h1>
        <p className="mt-3 max-w-sm text-sm text-muted">
          Opening the one-file phone book. iPhone and Android open that single page from the shop site — no extra
          files.
        </p>
        <a className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg" href={BOOK_FILE}>
          Open Code Book
        </a>
      </div>
    </main>
  );
}
