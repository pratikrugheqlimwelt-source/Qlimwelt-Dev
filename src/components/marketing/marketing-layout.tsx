import { AnnouncementBanner } from "@/components/marketing/announcement-banner";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

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
    <div className="min-h-screen bg-background">
      {showBanner && <AnnouncementBanner />}
      <MarketingNav variant={navVariant} />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
