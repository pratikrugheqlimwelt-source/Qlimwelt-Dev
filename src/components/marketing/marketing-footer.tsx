import Link from "next/link";
import { Logo } from "@/components/marketing/logo";
import { MetaLabel } from "@/components/marketing/editorial";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="section-container py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size="sm" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI-powered carbon intelligence platform for European businesses.
            </p>
          </div>
          <div>
            <MetaLabel>Platform</MetaLabel>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><Link href="/platform" className="transition-colors hover:text-foreground">Features</Link></li>
              <li><Link href="/#pricing" className="transition-colors hover:text-foreground">Pricing</Link></li>
              <li><Link href="/whats-new" className="transition-colors hover:text-foreground">What&apos;s New</Link></li>
              <li><Link href="/login" className="transition-colors hover:text-foreground">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <MetaLabel>Company</MetaLabel>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><Link href="/#about" className="transition-colors hover:text-foreground">About</Link></li>
              <li><a href="#" className="transition-colors hover:text-foreground">Blog</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">Careers</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">Press</a></li>
            </ul>
          </div>
          <div>
            <MetaLabel>Legal</MetaLabel>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="transition-colors hover:text-foreground">Privacy Policy</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">Terms of Service</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">GDPR</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
          <MetaLabel>© 2026 QLIMWELT AI · BERLIN, GERMANY</MetaLabel>
          <div className="flex gap-6 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">LinkedIn</a>
            <a href="#" className="transition-colors hover:text-foreground">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
