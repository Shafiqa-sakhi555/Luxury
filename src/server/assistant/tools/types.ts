export type AssistantToolName =
  | "search_products"
  | "get_product"
  | "check_stock"
  | "get_branches"
  | "search_faq"
  | "get_policy";

export type ToolResult = {
  tool: AssistantToolName;
  summary: string;
  data: unknown;
};

export type ToolContext = {
  message: string;
  slug?: string;
};
