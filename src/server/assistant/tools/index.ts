import { runCheckStock } from "./check-stock";
import { runGetBranches } from "./get-branches";
import { runGetPolicy } from "./get-policy";
import { runGetProduct } from "./get-product";
import { runSearchFaq } from "./search-faq";
import { runSearchProducts } from "./search-products";
import type { ToolContext, ToolResult } from "./types";

const RUNNERS = [
  runSearchProducts,
  runGetProduct,
  runCheckStock,
  runGetBranches,
  runSearchFaq,
  runGetPolicy,
];

export async function runAssistantTools(ctx: ToolContext): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  for (const runner of RUNNERS) {
    const result = await runner(ctx);
    if (result) results.push(result);
  }

  return results;
}

export function formatToolResultsForPrompt(results: ToolResult[]): string {
  if (results.length === 0) {
    return "TOOL RESULTS: (none — answer from verified company/FAQ knowledge only, or ask a clarifying question)";
  }

  return `TOOL RESULTS (authoritative — use only this data for products, prices, stock, branches, policies):

${results
  .map(
    (r) => `[${r.tool}] ${r.summary}
${JSON.stringify(r.data, null, 2)}`
  )
  .join("\n\n")}`;
}
