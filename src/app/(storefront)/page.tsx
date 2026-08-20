import { HeroSection } from "@/components/sections/HeroSection";
import { HeroStatsSection } from "@/components/sections/HeroStatsSection";
import { FeaturedCategoriesSection } from "@/components/sections/FeaturedCategoriesSection";
import { PropertiesShowcase } from "@/components/sections/PropertiesShowcase";
import { WhyChooseUsSection } from "@/components/sections/WhyChooseUsSection";
import { SocialProofStrip } from "@/components/sections/SocialProofStrip";
import { JalalAssistanceSection } from "@/components/sections/JalalAssistanceSection";
import { ShopStylesSection } from "@/components/sections/ShopStylesSection";
import { WhyJalals } from "@/components/sections/WhyJalals";
import { FounderPreviewSection } from "@/components/sections/FounderPreviewSection";
import { FeaturedDestinations } from "@/components/sections/FeaturedDestinations";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { homeJsonLd } from "@/lib/seo";
import { listProducts, listShopFilterCategories, listShopCategoryCards } from "@/server/catalog/products";

export default async function HomePage() {
  const [{ items }, filterCategories, categoryCards] = await Promise.all([
    listProducts({ pageSize: 12 }).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      pageSize: 12,
      totalPages: 0,
    })),
    listShopFilterCategories().catch(() => []),
    listShopCategoryCards().catch(() => []),
  ]);

  const showcaseProducts = [...items].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    return 0;
  });

  return (
    <div className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <HeroSection />
      <HeroStatsSection />
      <FeaturedCategoriesSection categories={categoryCards} />
      <PropertiesShowcase
        products={showcaseProducts}
        filterCategories={filterCategories.map((category) => ({
          label: category.label,
          slug: category.slug,
        }))}
      />
      <WhyChooseUsSection />
      <SocialProofStrip />
      <JalalAssistanceSection />
      <ShopStylesSection />
      <WhyJalals />
      <FounderPreviewSection />
      <FeaturedDestinations />
      <TestimonialsSection />
    </div>
  );
}
