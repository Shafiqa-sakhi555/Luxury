import type { ConsultationResult } from "./consultation";
import type { ToolResult } from "./tools/types";

function hasAuthoritativeProducts(toolResults: ToolResult[]) {
  return toolResults.some((r) => {
    const data = r.data as {
      products?: unknown[];
      found?: boolean;
      recommendations?: unknown[];
      mode?: string;
    };

    if (r.tool === "get_product") return data.found === true;
    if (r.tool === "search_products") return (data.products?.length ?? 0) > 0;
    if (r.tool === "check_stock") return (data.products?.length ?? 0) > 0;
    if (r.tool === "design_consultation" && data.mode === "recommend") {
      return (data.recommendations?.length ?? 0) > 0;
    }
    return false;
  });
}

/** Strip obvious hallucinated price patterns when no product tool returned prices */
export function validateAssistantResponse(content: string, toolResults: ToolResult[]): string {
  let text = content.trim();
  const productToolHasItems = hasAuthoritativeProducts(toolResults);

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

export function buildFallbackResponse(
  toolResults: ToolResult[],
  consultation?: ConsultationResult
): string {
  if (consultation?.mode === "gather_info" && consultation.nextQuestion) {
    return `I'd love to help you design your space. ${consultation.nextQuestion}`;
  }

  if (consultation?.mode === "recommend" && consultation.recommendations.length > 0) {
    const intro = consultation.designGuidance
      ? `${consultation.designGuidance}\n\n`
      : "Based on your preferences, here are live catalog options:\n\n";

    const list = consultation.recommendations
      .map(
        (p) =>
          `• **${p.name}** (${p.category}) — ${p.price}\n  ${p.shortDescription ?? p.reason}\n  View: ${p.url}`
      )
      .join("\n\n");

    return `${intro}${list}\n\n_Note: AI summarisation is offline — showing live catalog matches._`;
  }

  if (toolResults.length === 0) {
    return "Assalam o Alaikum! I'm Jalal Assistance. Ask me about our curtains, carpets, prayer mats, branches across Gilgit-Baltistan, delivery, or design consultation — I'll look up live information for you.";
  }

  const parts: string[] = ["Here's what I found:"];

  for (const r of toolResults) {
    if (r.tool === "design_consultation") {
      const data = r.data as {
        mode?: string;
        recommendations?: Array<{
          name: string;
          category: string;
          price: string;
          url: string;
          shortDescription?: string | null;
        }>;
      };
      if (data.mode === "recommend") {
        parts.push(
          (data.recommendations ?? [])
            .map(
              (p) =>
                `• **${p.name}** (${p.category}) — ${p.price} → ${p.url}${p.shortDescription ? `\n  ${p.shortDescription}` : ""}`
            )
            .join("\n")
        );
      }
    }

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

    if (r.tool === "get_order_status") {
      const data = r.data as {
        authenticated?: boolean;
        found?: boolean;
        loginUrl?: string;
        order?: {
          orderNumber: string;
          statusLabel: string;
          statusMeaning?: string | null;
          nextSteps?: string | null;
          total: string;
          items?: Array<{ name: string; quantity: number }>;
        };
      };
      if (data.authenticated === false) {
        parts.push(`Please [log in](${data.loginUrl ?? "/login"}) to check your order status.`);
      } else if (data.found && data.order) {
        parts.push(
          `**Order ${data.order.orderNumber}** — ${data.order.statusLabel}\n${data.order.statusMeaning ?? ""}\nTotal: ${data.order.total}${data.order.nextSteps ? `\nNext: ${data.order.nextSteps}` : ""}`
        );
      }
    }

    if (r.tool === "get_my_orders") {
      const data = r.data as {
        authenticated?: boolean;
        orders?: Array<{ orderNumber: string; status: string }>;
        loginUrl?: string;
      };
      if (data.authenticated === false) {
        parts.push(`Please log in at ${data.loginUrl ?? "/login"} to view your orders.`);
      } else if (data.orders?.length) {
        parts.push(
          data.orders.map((o) => `• **${o.orderNumber}** — ${o.status}`).join("\n")
        );
      }
    }

    if (r.tool === "get_my_cart") {
      const data = r.data as {
        itemCount?: number;
        items?: Array<{ name: string; quantity: number; unitPrice: string }>;
        totals?: { total: string };
        cartUrl?: string;
      };
      if (!data.itemCount) {
        parts.push("Your cart is empty.");
      } else {
        parts.push(
          (data.items ?? [])
            .map((i) => `• ${i.name} × ${i.quantity} — ${i.unitPrice}`)
            .join("\n") + `\nTotal: ${data.totals?.total ?? ""} → ${data.cartUrl ?? "/cart"}`
        );
      }
    }

    if (r.tool === "request_handoff") {
      const data = r.data as {
        handoffId?: string;
        contact?: { phone: string; email: string };
      };
      parts.push(
        `I've noted your request${data.handoffId ? ` (ref ${data.handoffId.slice(0, 8)})` : ""}. Our team will follow up. Call ${data.contact?.phone ?? "+92 313 5205272"} or email ${data.contact?.email ?? "info@jalalshome.pk"}.`
      );
    }
  }

  parts.push("\n_Note: AI summarisation is temporarily offline — showing direct lookup results._");
  return parts.join("\n\n");
}
