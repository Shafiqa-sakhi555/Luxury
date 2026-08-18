import { loadBranchKnowledge } from "../knowledge/loader";
import type { ToolContext, ToolResult } from "./types";

const CITY_ALIASES: Record<string, string> = {
  gilgit: "Gilgit",
  hunza: "Hunza",
  skardu: "Skardu",
  gakuch: "Gakuch",
  kashrot: "Gilgit",
};

export async function runGetBranches(ctx: ToolContext): Promise<ToolResult | null> {
  const lower = ctx.message.toLowerCase();
  const triggers = [
    "branch", "branches", "showroom", "store", "location", "where are you",
    "opening hour", "hours", "visit", "nearest", "closest", "address",
  ];

  if (!triggers.some((t) => lower.includes(t))) return null;

  const branches = await loadBranchKnowledge();
  let filtered = branches.branches;

  for (const [key, city] of Object.entries(CITY_ALIASES)) {
    if (lower.includes(key)) {
      filtered = branches.branches.filter(
        (b) => b.city.toLowerCase() === city.toLowerCase() || b.branch_id.includes(key)
      );
      break;
    }
  }

  const list = (filtered.length ? filtered : branches.branches).map((b) => ({
    id: b.branch_id,
    name: b.name,
    city: b.city,
    address: b.address,
    phone: b.phone,
    openingHours: b.opening_hours,
    services: b.services,
    latitude: b.latitude,
    longitude: b.longitude,
  }));

  return {
    tool: "get_branches",
    summary: `Found ${list.length} branch(es).`,
    data: { branches: list },
  };
}
