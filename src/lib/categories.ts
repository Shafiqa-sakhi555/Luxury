import { placeholder } from "./images";

export type Category = {
  name: string;
  slug: string;
  description: string;
  image: string;
  parent?: string;
};

export const categories: Category[] = [
  {
    name: "Prayer Mats",
    slug: "prayer-mats",
    description: "Foam, roll and travel janamaz with custom sizing.",
    image: placeholder("1609599006353-e629aaabfeae"),
  },
  {
    name: "Rugs",
    slug: "rugs",
    description: "Modern, classical and heritage rugs in every size.",
    image: placeholder("1600166898405-da9535204843"),
  },
  {
    name: "Carpet",
    slug: "carpet",
    description: "Wall-to-wall carpet and tiles for full-room coverage.",
    image: placeholder("1616486338812-3dadae4b4ace"),
  },
  {
    name: "Door Mats",
    slug: "door-mats",
    description: "Coir, rubber and personalised entrance mats.",
    image: placeholder("1615874959470-dfccc655caeb"),
  },
  {
    name: "Flooring",
    slug: "flooring",
    description: "LVT, laminate, vinyl and artificial grass surfaces.",
    image: placeholder("1615971677493-3d975081ea2f"),
  },
  {
    name: "Furniture",
    slug: "furniture",
    description: "Complete home furniture from sofas to storage.",
    image: placeholder("1555041469-a586c61ea9bc"),
  },
  {
    name: "Sofa",
    slug: "sofa",
    description: "Sectionals, recliners and sofa-cum-beds.",
    image: placeholder("1555041469-a586c61ea9bc"),
    parent: "furniture",
  },
  {
    name: "Chair",
    slug: "chair",
    description: "Dining, accent and lounge seating.",
    image: placeholder("1506439773649-6e0eb8cfb237"),
    parent: "furniture",
  },
  {
    name: "Beds",
    slug: "beds",
    description: "Single to king sizes with storage options.",
    image: placeholder("1505693416388-ac5ce068fe85"),
    parent: "furniture",
  },
  {
    name: "Table",
    slug: "table",
    description: "Dining, centre, console and study tables.",
    image: placeholder("1617806118233-18e1de247200"),
    parent: "furniture",
  },
  {
    name: "Cupboard",
    slug: "cupboard",
    description: "Wardrobes, sideboards and showcase units.",
    image: placeholder("1595428774223-ef52624120d2"),
    parent: "furniture",
  },
  {
    name: "Cushions",
    slug: "cushions",
    description: "Covers, filled cushions, throws and bolsters.",
    image: placeholder("1584100936595-c0654b55a2d2"),
  },
  {
    name: "Decor",
    slug: "decor",
    description: "Wall art, mirrors, lamps and decorative accents.",
    image: placeholder("1616046229476-9481a218f8b8"),
  },
];

export const topLevelCategories = categories.filter((c) => !c.parent);
