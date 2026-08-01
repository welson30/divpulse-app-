import Link from "next/link";
import { ChevronRight, Download, KeyRound } from "lucide-react";

/**
 * Deliberately two rows, not three. A "Delete account" row was cut
 * entirely rather than shipped disabled — an account-deletion flow needs
 * its own product decision (data retention, Stripe cancellation, support
 * burden) before it belongs in the UI at all, not just a styling pass.
 */
export function SettingsQuickActions() {
  return (
    <div className="flex flex-col gap-1">
      <Link
        href="/settings?tab=security"
        className="flex items-center gap-sp-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-hover"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-text-secondary">
          <KeyRound className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-text-primary">Change password</div>
          <div className="text-xs text-text-secondary">Update your account password</div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-text-tertiary" aria-hidden />
      </Link>

      {/* Plain navigation, not a client component — the browser turns
          this into a download on its own once it sees the route's
          Content-Disposition header, no JS required. */}
      <a
        href="/api/account/export"
        className="flex items-center gap-sp-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-hover"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-text-secondary">
          <Download className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-text-primary">Download my data</div>
          <div className="text-xs text-text-secondary">Export your holdings, watchlist, and account data</div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-text-tertiary" aria-hidden />
      </a>
    </div>
  );
}
