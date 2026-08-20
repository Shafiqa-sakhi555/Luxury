import { runCheckStock } from "./check-stock";
import { runDesignConsultation } from "./design-consultation";
import { runGetBranches } from "./get-branches";
import { runGetMyCart } from "./get-my-cart";
import { runGetMyOrders, runGetOrderStatus } from "./get-my-orders";
import { runGetPolicy } from "./get-policy";
import { runGetProduct } from "./get-product";
import { runRequestHandoff } from "./request-handoff";
import { runSearchFaq } from "./search-faq";
import { runSearchProducts } from "./search-products";
import type { ToolContext, ToolResult } from "./types";

export async function runAssistantTools(ctx: ToolContext): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  const consultation = await runDesignConsultation(ctx);
  if (consultation) results.push(consultation);

  const consultationData = consultation?.data as { mode?: string } | undefined;
  const consultationHandledProducts =
    consultationData?.mode === "recommend" || consultationData?.mode === "gather_info";

  const authAndSupportRunners = [
    runGetOrderStatus,
    runGetMyOrders,
    runGetMyCart,
    runRequestHandoff,
  ];

  for (const runner of authAndSupportRunners) {
    const result = await runner(ctx);
    if (result) results.push(result);
  }

  const catalogRunners = [
    runGetProduct,
    runCheckStock,
    runGetBranches,
    runSearchFaq,
    runGetPolicy,
    ...(consultationHandledProducts ? [] : [runSearchProducts]),
  ];

  for (const runner of catalogRunners) {
    const result = await runner(ctx);
    if (result) results.push(result);
  }

  return results;
}

export function formatToolResultsForPrompt(results: ToolResult[]): string {
  if (results.length === 0) {
    return "TOOL RESULTS: (none — answer from verified company/FAQ knowledge only, or ask a clarifying question)";
  }

  return `TOOL RESULTS (authoritative — use only this data for products, prices, stock, branches, policies, orders):

${results
  .map(
    (r) => `[${r.tool}] ${r.summary}
${JSON.stringify(r.data, null, 2)}`
  )
  .join("\n\n")}`;
}
