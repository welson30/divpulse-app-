import { BrokerConnectionsSection } from "@/components/marketing/broker-connections-section";
import { DiversificationSection } from "@/components/marketing/diversification-section";
import { DividendAlertsSection } from "@/components/marketing/dividend-alerts-section";
import { DividendCalendarSection } from "@/components/marketing/dividend-calendar-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { NotificationTemplatesSection } from "@/components/marketing/notification-templates-section";
import { PortfolioOverviewSection } from "@/components/marketing/portfolio-overview-section";
import { ProductSection } from "@/components/marketing/product-section";
import { SiteHeader } from "@/components/marketing/site-header";
import { UpcomingPaymentsSection } from "@/components/marketing/upcoming-payments-section";
import { WatchlistSection } from "@/components/marketing/watchlist-section";

export default function HomePage() {
  return (
    <div className="pp-landing min-h-screen">
      {/*
        Figma Homepage:
        Header 1:2452 = 96.8px
        Section 1:7   = 1196.7px (hero + stats)
        Section 1:347 = 977.64px (broker connections)
        Section 1:411 = 1063.04px (dividend alerts)
        Section 1:509 = 1296.95px (notification templates)
        Section 1:752 = 1038.54px (product dashboard)
        Section 1:1033 = 602.94px (diversification)
        Section 1:1153 = 1147.45px (dividend calendar)
        Section 1:1346 = portfolio overview
        Section 1:1457 = upcoming payments
        Section 1:1591 = watchlist
      */}
      <SiteHeader />
      <main>
        <HeroSection />
        <BrokerConnectionsSection />
        <DividendAlertsSection />
        <NotificationTemplatesSection />
        <ProductSection />
        <DiversificationSection />
        <DividendCalendarSection />
        <PortfolioOverviewSection />
        <UpcomingPaymentsSection />
        <WatchlistSection />
      </main>
    </div>
  );
}
