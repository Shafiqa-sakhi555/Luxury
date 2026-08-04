import { HeroSection } from "@/components/sections/HeroSection";
import { CategoriesSection } from "@/components/sections/CategoriesSection";
import { PropertiesShowcase } from "@/components/sections/PropertiesShowcase";
import { WhyJalals } from "@/components/sections/WhyJalals";
import { FounderPreviewSection } from "@/components/sections/FounderPreviewSection";
import { FeaturedDestinations } from "@/components/sections/FeaturedDestinations";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="relative">
      <HeroSection />
      <CategoriesSection />
      <PropertiesShowcase />
      <WhyJalals />
      <FounderPreviewSection />
      <FeaturedDestinations />
      <TestimonialsSection />
      <Footer />
    </div>
  );
}
