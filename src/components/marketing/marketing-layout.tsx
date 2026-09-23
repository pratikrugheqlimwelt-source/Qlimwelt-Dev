import { AnnouncementBanner } from "@/components/marketing/announcement-banner";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { cn } from "@/lib/utils";

interface MarketingLayoutProps {
  children: React.ReactNode;
  showBanner?: boolean;
  navVariant?: "home" | "default";
}

export function MarketingLayout({
  children,
  showBanner = false,
  navVariant = "default",
}: MarketingLayoutProps) {
  return (
    <div className={cn("relative min-h-screen w-full overflow-x-hidden bg-background")}>
      {showBanner && <AnnouncementBanner />}
      <MarketingNav variant={navVariant} />
      <main className="relative z-[2] w-full min-w-0">{children}</main>
      <MarketingFooter />
    </div>
  );
}
