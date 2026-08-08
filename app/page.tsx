import { BrokerConnectionsSection } from "@/components/marketing/broker-connections-section";
import { DividendAlertsSection } from "@/components/marketing/dividend-alerts-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { NotificationTemplatesSection } from "@/components/marketing/notification-templates-section";
import { SiteHeader } from "@/components/marketing/site-header";

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
      */}
      <SiteHeader />
      <main>
        <HeroSection />
        <BrokerConnectionsSection />
        <DividendAlertsSection />
        <NotificationTemplatesSection />
      </main>
    </div>
  );
}
