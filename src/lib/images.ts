/** Local image paths — all assets live in /public/images */

export const images = {
  hero: "/images/hero/living-room.jpg",

  showrooms: {
    gilgit: "/images/showrooms/gilgit.jpg",
    hunza: "/images/showrooms/hunza.jpg",
    skardu: "/images/showrooms/skardu.jpg",
    ghizer: "/images/showrooms/ghizer.jpg",
    astore: "/images/showrooms/astore.jpg",
    nagar: "/images/showrooms/nagar.jpg",
  },

  products: {
    heritageCarpet: "/images/products/heritage-carpet.jpg",
    velvetSofa: "/images/products/velvet-sofa.jpg",
    woolRug: "/images/products/wool-rug.jpg",
    sectionalSofa: "/images/products/sectional-sofa.jpg",
    silkCarpet: "/images/products/silk-carpet.jpg",
    loungeChair: "/images/products/lounge-chair.jpg",
    velvetCurtains: "/images/products/velvet-curtains.jpg",
    luxuryBed: "/images/products/luxury-bed.jpg",
    kilimRug: "/images/products/kilim-rug.jpg",
  },

  craft: {
    materials: "/images/craft/materials.jpg",
    weaving: "/images/craft/weaving.jpg",
    delivery: "/images/craft/delivery.jpg",
  },

  collections: {
    carpets: "/images/collections/carpets.jpg",
    sofas: "/images/collections/sofas.jpg",
    curtains: "/images/collections/curtains.jpg",
    beds: "/images/collections/beds.jpg",
    cushions: "/images/collections/cushions.jpg",
    rugs: "/images/collections/rugs.jpg",
  },

  testimonials: {
    fatima: "/images/testimonials/customer-1.jpg",
    ahmed: "/images/testimonials/customer-2.jpg",
    sana: "/images/testimonials/customer-3.jpg",
  },

  journal: {
    carpetCare: "/images/journal/carpet-care.jpg",
    sofaGuide: "/images/journal/sofa-guide.jpg",
    weaving: "/images/journal/weaving-heritage.jpg",
  },

  sections: {
    mapBg: "/images/sections/gb-mountains.jpg",
    whyLexury: "/images/sections/showroom-interior.jpg",
    membership: "/images/sections/membership-bg.jpg",
    advisor: "/images/sections/home-advisor.jpg",
    loading: "/images/sections/carpet-detail.jpg",
  },
} as const;

export type ImagePath = string;
