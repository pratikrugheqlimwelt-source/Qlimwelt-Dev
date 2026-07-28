import Link from "next/link";

export function AnnouncementBanner() {
  return (
    <div className="border-b border-brand/20 bg-brand-light/50 px-4 py-2.5 text-center text-sm">
      <span className="text-muted-foreground">
        New: Carbon Chat is live — ask your emissions data anything, in plain language.{" "}
      </span>
      <Link href="/whats-new" className="font-semibold text-brand-dark underline-offset-2 hover:underline">
        See what&apos;s new →
      </Link>
    </div>
  );
}
