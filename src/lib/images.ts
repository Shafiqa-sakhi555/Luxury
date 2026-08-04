/** Local placeholder paths (self-hosted under /public/images/placeholders) */

export const placeholder = (id: string) => `/images/placeholders/${id}.jpg`;

const p = placeholder;

export const images = {
  hero: "/images/sections/img 1.jpeg",
  logo: "/brand/jalals-logo.png",

  showrooms: {
    gilgit: p("1449824913935-59a10b8d2000"),
    hunza: p("1464822759023-fed622ff2c3b"),
    skardu: p("1506905925346-21bda4d32df4"),
    ghizer: p("1519681393784-d120267933ba"),
    astore: p("1469474968028-56623f02e42e"),
    nagar: p("1501785888041-af3ef285b470"),
  },

  products: {
    heritageCarpet: p("1600166898405-da9535204843"),
    velvetSofa: p("1555041469-a586c61ea9bc"),
    woolRug: p("1600210492486-724fe5c67fb0"),
    sectionalSofa: p("1493663284031-b7e3aefcae8e"),
    silkCarpet: p("1600566753190-17f0baa2a6c3"),
    loungeChair: p("1506439773649-6e0eb8cfb237"),
    velvetCurtains: p("1616046229476-9481a218f8b8"),
    luxuryBed: p("1505693416388-ac5ce068fe85"),
    kilimRug: p("1600166898405-da9535204843"),
  },

  craft: {
    materials: p("1600166898405-da9535204843"),
    weaving: p("1600566753190-17f0baa2a6c3"),
    delivery: p("1600585154340-be6161a56a0c"),
  },

  collections: {
    carpets: p("1600166898405-da9535204843"),
    sofas: p("1555041469-a586c61ea9bc"),
    curtains: p("1616046229476-9481a218f8b8"),
    beds: p("1505693416388-ac5ce068fe85"),
    cushions: p("1584100936595-c0654b55a2d2"),
    rugs: p("1600210492486-724fe5c67fb0"),
  },

  testimonials: {
    fatima: p("1494790108377-be9c29b29330"),
    ahmed: p("1507003211169-0a1dd7228f2d"),
    sana: p("1438761681033-6461ffad8d80"),
  },

  journal: {
    carpetCare: p("1600166898405-da9535204843"),
    sofaGuide: p("1555041469-a586c61ea9bc"),
    weaving: p("1600566753190-17f0baa2a6c3"),
  },

  sections: {
    mapBg: p("1464822759023-fed622ff2c3b"),
    whyJalals: p("1616486338812-3dadae4b4ace"),
    membership: p("1600585154340-be6161a56a0c"),
    advisor: p("1616046229476-9481a218f8b8"),
    loading: p("1600166898405-da9535204843"),
  },
} as const;

export type ImagePath = string;
