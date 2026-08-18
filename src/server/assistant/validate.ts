import type { ToolResult } from "./tools/types";

/** Strip obvious hallucinated price patterns when no product tool returned prices */
export function validateAssistantResponse(content: string, toolResults: ToolResult[]): string {
  let text = content.trim();

  const hasProductData = toolResults.some(
    (r) => r.tool === "search_products" || r.tool === "get_product" || r.tool === "check_stock"
  );

  const productToolHasItems =
    hasProductData &&
    toolResults.some((r) => {
      const data = r.data as { products?: unknown[]; found?: boolean; matches?: unknown[] };
      if (r.tool === "get_product") return data.found === true;
      if (r.tool === "search_products") return (data.products?.length ?? 0) > 0;
      if (r.tool === "check_stock") return (data.products?.length ?? 0) > 0;
      return false;
    });

  if (!productToolHasItems) {
    text = text.replace(/\bRs\.?\s*[\d,]+(?:\.\d+)?\b/gi, "[price — check product page]");
  }

  const bannedPhrases = [
    /Hunza Heritage Carpet/gi,
    /Royal Velvet 3\+2\+1/gi,
    /Comfort Lounge Chair/gi,
    /Kashan from Rs/gi,
  ];

  for (const pattern of bannedPhrases) {
    if (pattern.test(text) && !productToolHasItems) {
      text = text.replace(
        pattern,
        "a product from our catalog (search the shop for current options)"
      );
    }
  }

  return text;
}

export function buildFallbackResponse(toolResults: ToolResult[]): string {
  if (toolResults.length === 0) {
    return "Assalam o Alaikum! I'm Jalal Assistance. Ask me about our curtains, carpets, prayer mats, branches across Gilgit-Baltistan, delivery, or returns — I'll look up live information for you.";
  }

  const parts: string[] = ["Here's what I found:"];

  for (const r of toolResults) {
    if (r.tool === "search_products") {
      const data = r.data as {
        products?: Array<{ name: string; price: string; url: string; category: string }>;
      };
      const products = data.products ?? [];
      if (products.length === 0) {
        parts.push("I couldn't find matching products in our live catalog. Try a different search or browse /shop.");
      } else {
        parts.push(
          products
            .map((p) => `• **${p.name}** (${p.category}) — ${p.price} → ${p.url}`)
            .join("\n")
        );
      }
    }

    if (r.tool === "get_branches") {
      const data = r.data as {
        branches?: Array<{ name: string; city: string; phone: string; address: string }>;
      };
      parts.push(
        (data.branches ?? [])
          .map((b) => `• **${b.name}** — ${b.city}\n  ${b.address}\n  Phone: ${b.phone}`)
          .join("\n")
      );
    }

    if (r.tool === "search_faq") {
      const data = r.data as { matches?: Array<{ question: string; answer: string }> };
      const m = data.matches?.[0];
      if (m) parts.push(`**${m.question}**\n${m.answer}`);
    }

    if (r.tool === "get_policy") {
      const data = r.data as { title?: string; content?: string; placeholder?: boolean };
      if (data.content) {
        parts.push(
          `**${data.title}**${data.placeholder ? " (draft policy — confirm with orders@jalalsgroup.com)" : ""}:\n${data.content.slice(0, 500)}…`
        );
      }
    }

    if (r.tool === "check_stock") {
      const data = r.data as {
        products?: Array<{ name: string; stockStatus: string; stockQuantity: number | null; price: string }>;
      };
      for (const p of data.products ?? []) {
        parts.push(
          `• **${p.name}**: ${p.stockStatus}${p.stockQuantity != null ? ` (${p.stockQuantity} units)` : ""} — ${p.price}`
        );
      }
    }
  }

  parts.push("\n_Note: AI summarisation is temporarily offline — showing direct lookup results._");
  return parts.join("\n\n");
}
