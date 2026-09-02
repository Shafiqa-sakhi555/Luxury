import { categories, topLevelCategories } from "@/lib/categories";
import { heroContent, heroTrustBadges, whyChooseUs } from "@/lib/homeContent";
import { loadAllCategoryKnowledge, loadCompanyKnowledge } from "../knowledge/loader";
import type { ToolContext, ToolResult } from "./types";

const TRIGGERS = [
  "who are you",
  "what do you sell",
  "what do you offer",
  "about jalal",
  "about you",
  "about the",
  "your company",
  "who is jalal",
  "contact",
  "phone",
  "email",
  "whatsapp",
  "hello",
  "hi ",
  "assalam",
  "salam",
  "hey",
  "help",
  "what can you",
  "categories",
  "catalog",
  "shop",
  "services",
  "history",
  "founded",
  "established",
  "since when",
];

function isGreeting(message: string) {
  return /^(hi|hello|hey|salam|assalam[oa\s-]*alaikum|aoa|howdy|good (morning|afternoon|evening))[\s!.?]*$/i.test(
    message.trim()
  );
}

export async function runGetSiteInfo(ctx: ToolContext): Promise<ToolResult | null> {
  const lower = ctx.message.toLowerCase();
  const greeting = isGreeting(ctx.message);
  const wantsInfo = greeting || TRIGGERS.some((t) => lower.includes(t));

  if (!wantsInfo) return null;

  const [company, categoryKnowledge] = await Promise.all([
    loadCompanyKnowledge(),
    loadAllCategoryKnowledge().catch(() => []),
  ]);

  const catalog = topLevelCategories.map((category) => ({
    name: category.name,
    slug: category.slug,
    description: category.description,
    url: `/shop?category=${category.slug}`,
  }));

  const knowledgeNotes = categoryKnowledge.slice(0, 12).map((item) => ({
    name: item.name,
    slug: item.slug,
    description: item.description,
    rooms: item.suitable_rooms,
    materials: item.available_materials,
  }));

  return {
    tool: "get_site_info",
    summary: greeting
      ? "Customer greeted the assistant — share a warm welcome and how you can help."
      : "Loaded company, catalog, and contact details from the website.",
    data: {
      greeting,
      company: {
        name: company.company_name,
        tagline: company.tagline,
        description: company.description,
        established: company.established,
        location: company.location,
        website: company.website,
        history: company.history_summary,
        founder: company.leadership[0] ?? null,
        brands: company.legal_brands,
        services: company.services,
        milestones: company.milestones,
        contact: company.contact,
      },
      storefront: {
        headline: heroContent.headline,
        subtitle: heroContent.subtitle,
        trust: heroTrustBadges.map((badge) => badge.label),
        whyChooseUs: whyChooseUs.map((item) => ({ title: item.title, description: item.description })),
      },
      categories: catalog,
      categoryDetails: knowledgeNotes,
      furnitureSections: categories
        .filter((category) => category.parent === "furniture")
        .map((category) => ({ name: category.name, slug: category.slug, description: category.description })),
      usefulLinks: [
        { label: "Shop", url: "/shop" },
        { label: "Stores", url: "/stores" },
        { label: "Track order", url: "/track" },
        { label: "About us", url: "/about" },
        { label: "Contact", url: "/contact" },
      ],
    },
  };
}
