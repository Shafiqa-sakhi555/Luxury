import { HeroSection } from "@/components/sections/HeroSection";
import { HeroStatsSection } from "@/components/sections/HeroStatsSection";
import { FeaturedCategoriesSection } from "@/components/sections/FeaturedCategoriesSection";
import { WhyChooseUsSection } from "@/components/sections/WhyChooseUsSection";import { SocialProofStrip } from "@/components/sections/SocialProofStrip";
import { CollectionsStrip } from "@/components/sections/CollectionsStrip";
import { PropertiesShowcase } from "@/components/sections/PropertiesShowcase";
import { ShopStylesSection } from "@/components/sections/ShopStylesSection";
import { WhyJalals } from "@/components/sections/WhyJalals";
import { FounderPreviewSection } from "@/components/sections/FounderPreviewSection";
import { FeaturedDestinations } from "@/components/sections/FeaturedDestinations";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { Footer } from "@/components/layout/Footer";
import { homeJsonLd } from "@/lib/seo";

export default function HomePage() {
  return (
    <div className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <HeroSection />
      <HeroStatsSection />
      <FeaturedCategoriesSection />
      <WhyChooseUsSection />      <SocialProofStrip />
      <CollectionsStrip />
      <PropertiesShowcase />
      <ShopStylesSection />
      <WhyJalals />
      <FounderPreviewSection />
      <FeaturedDestinations />
      <TestimonialsSection />
      <Footer />
    </div>
  );
}
