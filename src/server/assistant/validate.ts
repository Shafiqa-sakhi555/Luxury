import type { AssistantProductRecommendation } from "@/types/assistant";
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

export function extractProductCards(toolResults: ToolResult[]): AssistantProductRecommendation[] {
  const cards: AssistantProductRecommendation[] = [];
  const seen = new Set<string>();

  for (const result of toolResults) {
    if (result.tool === "design_consultation") {
      const data = result.data as { recommendations?: AssistantProductRecommendation[] };
      for (const product of data.recommendations ?? []) {
        if (!seen.has(product.id)) {
          seen.add(product.id);
          cards.push(product);
        }
      }
    }

    if (result.tool === "search_products" || result.tool === "check_stock") {
      const data = result.data as { products?: AssistantProductRecommendation[] };
      for (const product of data.products ?? []) {
        if (product.id && !seen.has(product.id)) {
          seen.add(product.id);
          cards.push(product);
        }
      }
    }

    if (result.tool === "get_product") {
      const data = result.data as AssistantProductRecommendation & { found?: boolean };
      if (data.found && data.id && !seen.has(data.id)) {
        seen.add(data.id);
        cards.push(data);
      }
    }
  }

  return cards.slice(0, 4);
}

export function buildSuggestedReplies(toolResults: ToolResult[], consultation?: ConsultationResult): string[] {
  const tools = new Set(toolResults.map((r) => r.tool));

  if (tools.has("get_policy") || tools.has("search_faq")) {
    return ["Where are your stores?", "Show carpets", "Talk to a person"];
  }

  if (consultation?.mode !== "not_consultation" && consultation?.suggestedReplies?.length) {
    return consultation.suggestedReplies.slice(0, 4);
  }

  if (tools.has("get_my_cart")) {
    return ["What's the delivery cost?", "Help me checkout", "Show similar products"];
  }
  if (tools.has("get_my_orders") || tools.has("get_order_status")) {
    return ["Track another order", "Speak to someone", "Delivery information"];
  }
  if (tools.has("get_branches")) {
    return ["Opening hours", "How do I get there?", "Call the Gilgit showroom"];
  }
  if (tools.has("search_products") || tools.has("get_product") || tools.has("check_stock")) {
    return ["Tell me more about the first one", "Help me design my room", "Do you deliver?"];
  }
  if (tools.has("get_policy")) {
    return ["Where are your stores?", "Talk to a person", "Show carpets"];
  }
  if (tools.has("get_site_info")) {
    return ["Help me design my living room", "Show dining tables", "Where are your stores?", "Track my order"];
  }

  return ["Help me design my living room", "Show carpets", "Where are your stores?", "Track my order"];
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
        "a product from our catalog (I can search the shop for current options)"
      );
    }
  }

  return text;
}

export function buildFallbackResponse(
  toolResults: ToolResult[],
  consultation?: ConsultationResult
): string {
  const hasFactualTools = toolResults.some((r) =>
    ["get_policy", "search_faq", "get_branches", "get_site_info", "get_my_cart", "get_my_orders", "get_order_status"].includes(
      r.tool
    )
  );

  if (
    !hasFactualTools &&
    consultation?.mode === "gather_info" &&
    consultation.nextQuestion
  ) {
    return `I'd love to help you put this room together. ${consultation.nextQuestion}`;
  }

  if (consultation?.mode === "recommend" && consultation.recommendations.length > 0) {
    const intro = consultation.designGuidance
      ? `${consultation.designGuidance}\n\nHere are a few pieces from our live catalog that fit:`
      : "Based on what you've shared, here are a few options from our live catalog:";

    const list = consultation.recommendations
      .map(
        (p) =>
          `• **${p.name}** (${p.category}) — ${p.price}\n  ${p.shortDescription ?? p.reason ?? ""}\n  View: ${p.url}`
      )
      .join("\n\n");

    return `${intro}\n\n${list}\n\nWould you like more details on any of these, or shall we try a different style?`;
  }

  if (toolResults.length === 0) {
    return "Assalam o Alaikum! I'm Jalal Assistance — happy to help you find carpets, curtains, furniture, dining sets, prayer mats, and more. What are you looking for today: a room idea, a product, a nearby showroom, or an order?";
  }

  const parts: string[] = [];

  for (const r of toolResults) {
    if (r.tool === "get_site_info") {
      const data = r.data as {
        greeting?: boolean;
        company?: { name?: string; description?: string; contact?: { phone?: string } };
        categories?: Array<{ name: string }>;
      };
      const categoryNames = (data.categories ?? []).slice(0, 8).map((c) => c.name).join(", ");
      if (data.greeting) {
        parts.push(
          `Assalam o Alaikum! Welcome to ${data.company?.name ?? "Jalal's Home Solution"}. I can help you choose carpets, curtains, furniture, dining sets, and more — or find a showroom and track an order. What can I help with today?`
        );
      } else {
        parts.push(
          `${data.company?.description ?? "We're a premium home furnishings retailer in Gilgit-Baltistan."}\n\nYou can browse ${categoryNames || "our full catalog"}. Call us on ${data.company?.contact?.phone ?? "+92 313 5205272"} anytime. What would you like to look at first?`
        );
      }
    }

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
        parts.push(
          "I couldn't find a match in the live catalog just now. Want me to try another category — carpets, curtains, furniture, or dining tables?"
        );
      } else {
        parts.push(
          "Here is what I found:\n" +
            products.map((p) => `• **${p.name}** (${p.category}) — ${p.price} → ${p.url}`).join("\n")
        );
      }
    }

    if (r.tool === "get_branches") {
      const data = r.data as {
        branches?: Array<{ name: string; city: string; phone: string; address: string }>;
      };
      parts.push(
        "Our showrooms:\n" +
          (data.branches ?? [])
            .map((b) => `• **${b.name}** — ${b.city}\n  ${b.address}\n  Phone: ${b.phone}`)
            .join("\n")
      );
    }

    if (r.tool === "search_faq") {
      const data = r.data as { matches?: Array<{ question: string; answer: string }> };
      const m = data.matches?.[0];
      if (m) parts.push(`${m.answer}`);
    }

    if (r.tool === "get_policy") {
      const data = r.data as { title?: string; content?: string; placeholder?: boolean };
      if (data.content) {
        parts.push(
          `**${data.title}**${data.placeholder ? " (please confirm with orders@jalalsgroup.com for final terms)" : ""}:\n${data.content.slice(0, 500)}…`
        );
      }
    }

    if (r.tool === "check_stock") {
      const data = r.data as {
        products?: Array<{ name: string; stockStatus: string; stockQuantity: number | null; price: string }>;
      };
      for (const p of data.products ?? []) {
        parts.push(
          `**${p.name}** is ${p.stockStatus.replace(/_/g, " ")}${p.stockQuantity != null ? ` (${p.stockQuantity} available)` : ""} — ${p.price}.`
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
        };
      };
      if (data.authenticated === false) {
        parts.push(
          `I can check that as soon as you sign in. Please log in at ${data.loginUrl ?? "/login"}, or track with your order number at /track.`
        );
      } else if (data.found && data.order) {
        parts.push(
          `Order **${data.order.orderNumber}** is ${data.order.statusLabel}. ${data.order.statusMeaning ?? ""} Total: ${data.order.total}${data.order.nextSteps ? ` Next: ${data.order.nextSteps}` : ""}`
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
        parts.push(`Please log in at ${data.loginUrl ?? "/login"} and I'll pull up your orders.`);
      } else if (data.orders?.length) {
        parts.push(
          "Here are your recent orders:\n" +
            data.orders.map((o) => `• **${o.orderNumber}** — ${o.status}`).join("\n")
        );
      } else {
        parts.push("I don't see any orders on this account yet. Would you like help finding something to shop?");
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
        parts.push("Your cart is empty right now. Want me to find carpets, curtains, or furniture for you?");
      } else {
        parts.push(
          "Here's what's in your cart:\n" +
            (data.items ?? [])
              .map((i) => `• ${i.name} × ${i.quantity} — ${i.unitPrice}`)
              .join("\n") +
            `\nTotal: ${data.totals?.total ?? ""} — ${data.cartUrl ?? "/cart"}`
        );
      }
    }

    if (r.tool === "request_handoff") {
      const data = r.data as {
        handoffId?: string;
        contact?: { phone: string; email: string };
      };
      parts.push(
        `I've noted your request${data.handoffId ? ` (ref ${data.handoffId.slice(0, 8)})` : ""}. A team member will follow up. You can also call ${data.contact?.phone ?? "+92 313 5205272"} or email ${data.contact?.email ?? "info@jalalshome.pk"}.`
      );
    }

    if (r.tool === "get_product") {
      const data = r.data as {
        found?: boolean;
        name?: string;
        price?: string;
        url?: string;
        shortDescription?: string | null;
        stockStatus?: string;
      };
      if (data.found) {
        parts.push(
          `**${data.name}** is ${data.price}. ${data.shortDescription ?? ""} It's currently ${data.stockStatus?.replace(/_/g, " ") ?? "listed"}. See it here: ${data.url}`
        );
      }
    }
  }

  if (parts.length === 0) {
    return "I'm here — tell me the room, product, or store you have in mind and I'll look it up.";
  }

  return parts.join("\n\n");
}
