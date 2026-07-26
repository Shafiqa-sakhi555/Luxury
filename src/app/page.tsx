"use client";

import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturedDestinations } from "@/components/sections/FeaturedDestinations";
import { PropertiesShowcase } from "@/components/sections/PropertiesShowcase";
import { ExperiencesSection } from "@/components/sections/ExperiencesSection";
import { WhyLexury } from "@/components/sections/WhyLexury";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { CollectionsSection } from "@/components/sections/CollectionsSection";
import { MembershipSection } from "@/components/sections/MembershipSection";
import { AIConciergeSection } from "@/components/sections/AIConciergeSection";
import { GlobalMapSection } from "@/components/sections/GlobalMapSection";
import { JournalSection } from "@/components/sections/JournalSection";
import { Footer } from "@/components/layout/Footer";
import { ParticleBackground } from "@/components/shared/ParticleBackground";

export default function HomePage() {
  return (
    <>
      <ParticleBackground />
      <div className="relative z-10">
        <HeroSection />
        <FeaturedDestinations />
        <PropertiesShowcase />
        <ExperiencesSection />
        <WhyLexury />
        <TestimonialsSection />
        <CollectionsSection />
        <MembershipSection />
        <AIConciergeSection />
        <GlobalMapSection />
        <JournalSection />
        <Footer />
      </div>
    </>
  );
}
