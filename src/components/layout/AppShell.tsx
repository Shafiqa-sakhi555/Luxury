"use client";

import { LayoutGroup } from "framer-motion";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { LogoIntroOverlay } from "@/components/brand/LogoIntroOverlay";
import { Navbar } from "@/components/layout/Navbar";
import { PromoBar } from "@/components/layout/PromoBar";
import { LogoIntroProvider } from "@/contexts/LogoIntroContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LogoIntroProvider>
      <LayoutGroup id="brand-intro">
        <LogoIntroOverlay />
        <SmoothScrollProvider>
          <div className="fixed top-0 left-0 right-0 z-50">
            <PromoBar />
            <Navbar />
          </div>
          <main>{children}</main>
        </SmoothScrollProvider>
      </LayoutGroup>
    </LogoIntroProvider>
  );
}
