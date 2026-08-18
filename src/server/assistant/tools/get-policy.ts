import { loadPolicyMarkdown } from "../knowledge/loader";
import type { ToolContext, ToolResult } from "./types";

const POLICY_MAP: Array<{ keywords: string[]; slug: string; title: string }> = [
  { keywords: ["return", "exchange"], slug: "returns", title: "Returns" },
  { keywords: ["refund"], slug: "refunds", title: "Refunds" },
  { keywords: ["warranty", "defect", "guarantee"], slug: "warranty", title: "Warranty" },
  { keywords: ["deliver", "shipping", "dispatch"], slug: "delivery", title: "Delivery" },
  { keywords: ["install"], slug: "installation", title: "Installation" },
  { keywords: ["payment", "cod", "cash on delivery"], slug: "payments", title: "Payments" },
  { keywords: ["privacy", "data"], slug: "privacy", title: "Privacy" },
  { keywords: ["terms", "conditions"], slug: "terms", title: "Terms" },
];

export async function runGetPolicy(ctx: ToolContext): Promise<ToolResult | null> {
  const lower = ctx.message.toLowerCase();

  const match = POLICY_MAP.find((p) => p.keywords.some((k) => lower.includes(k)));
  if (!match) return null;

  const content = await loadPolicyMarkdown(match.slug);
  if (!content) {
    return {
      tool: "get_policy",
      summary: `Policy "${match.title}" not found.`,
      data: { slug: match.slug, content: null },
    };
  }

  return {
    tool: "get_policy",
    summary: `Loaded ${match.title} policy.`,
    data: {
      slug: match.slug,
      title: match.title,
      content: content.slice(0, 2000),
      placeholder: match.slug === "terms" || match.slug === "privacy" || match.slug === "returns",
    },
  };
}
