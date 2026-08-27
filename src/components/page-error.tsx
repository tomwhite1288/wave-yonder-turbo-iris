import { Component, type ErrorInfo, type ReactNode } from "react";

export class PageErrorBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message || "This page hit a snag." };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[field-ledger] page error", error, info.componentStack);
  }

  render() {
    if (this.state.message) {
      return (
        <div className="rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
          <p className="text-lg font-semibold">This page hit a snag</p>
          <p className="mt-1 text-sm text-muted">Stay in the shop — try the page again. Do not activate a second time.</p>
          <button
            type="button"
            className="mt-4 h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg"
            onClick={() => this.setState({ message: null })}
          >
            Try this page again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
