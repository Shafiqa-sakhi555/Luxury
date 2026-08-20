"use client";

import { LayoutGroup } from "framer-motion";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { LogoIntroOverlay } from "@/components/brand/LogoIntroOverlay";
import { Navbar } from "@/components/layout/Navbar";
import { PromoBar } from "@/components/layout/PromoBar";
import { Footer } from "@/components/layout/Footer";
import { LogoIntroProvider } from "@/contexts/LogoIntroContext";
import { AssistantProvider } from "@/contexts/AssistantContext";
import { SkipLink } from "@/components/layout/SkipLink";
import { JalalAssistanceWidget } from "@/components/assistant/JalalAssistanceWidget";

export type ShopNavCategory = {
  label: string;
  slug: string;
  href: string;
  description?: string;
};

export function AppShell({
  children,
  shopCategories = [],
}: {
  children: React.ReactNode;
  shopCategories?: ShopNavCategory[];
}) {
  return (
    <LogoIntroProvider>
      <AssistantProvider>
      <LayoutGroup id="brand-intro">
        <LogoIntroOverlay />
        <SmoothScrollProvider>
          <SkipLink />
          <div className="fixed top-0 left-0 right-0 z-50">
            <PromoBar />
            <Navbar shopCategories={shopCategories} />
          </div>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <JalalAssistanceWidget />
        </SmoothScrollProvider>
      </LayoutGroup>
      </AssistantProvider>
    </LogoIntroProvider>
  );
}
