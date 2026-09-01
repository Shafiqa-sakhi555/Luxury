export type AssistantToolName =
  | "search_products"
  | "get_product"
  | "check_stock"
  | "get_branches"
  | "search_faq"
  | "get_policy"
  | "get_site_info"
  | "design_consultation"
  | "get_my_orders"
  | "get_order_status"
  | "get_my_cart"
  | "request_handoff";

export type ToolResult = {
  tool: AssistantToolName;
  summary: string;
  data: unknown;
};

export type ToolContext = {
  message: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  slug?: string;
  sessionKey?: string;
  userContext?: import("../context").AssistantUserContext;
};
