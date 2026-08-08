import { HeroSection } from "@/components/marketing/hero-section";
import { SiteHeader } from "@/components/marketing/site-header";

export default function HomePage() {
  return (
    <div className="pp-landing min-h-screen">
      {/*
        Figma Homepage first paint:
        Header 1:2452 = 96.8px
        Section 1:7   = 1196.7px (hero + stats)
        Total ≈ 1293.5px
      */}
      <SiteHeader />
      <main>
        <HeroSection />
      </main>
    </div>
  );
}
