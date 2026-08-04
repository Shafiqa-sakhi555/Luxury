"use client";

import { LayoutGroup } from "framer-motion";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { LogoIntroOverlay } from "@/components/brand/LogoIntroOverlay";
import { Navbar } from "@/components/layout/Navbar";
import { LogoIntroProvider } from "@/contexts/LogoIntroContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LogoIntroProvider>
      <LayoutGroup id="brand-intro">
        <LogoIntroOverlay />
        <SmoothScrollProvider>
          <Navbar />
          <main>{children}</main>
        </SmoothScrollProvider>
      </LayoutGroup>
    </LogoIntroProvider>
  );
}
