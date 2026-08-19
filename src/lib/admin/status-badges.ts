export type AdminBadgeTone = "default" | "success" | "warning" | "danger" | "muted" | "info";

export function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function orderStatusTone(status: string): AdminBadgeTone {
  switch (status) {
    case "PENDING":
      return "warning";
    case "CONFIRMED":
    case "PROCESSING":
      return "info";
    case "PACKED":
    case "SHIPPED":
      return "default";
    case "DELIVERED":
      return "success";
    case "CANCELLED":
      return "danger";
    default:
      return "muted";
  }
}

export function productStatusTone(status: string): AdminBadgeTone {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "DRAFT":
      return "warning";
    case "ARCHIVED":
      return "muted";
    default:
      return "default";
  }
}

export function stockStatusTone(status: string): AdminBadgeTone {
  switch (status) {
    case "in_stock":
      return "success";
    case "low_stock":
      return "warning";
    case "out_of_stock":
      return "danger";
    default:
      return "muted";
  }
}

export function handoffStatusTone(status: string): AdminBadgeTone {
  switch (status) {
    case "PENDING":
      return "warning";
    case "IN_PROGRESS":
      return "info";
    case "RESOLVED":
      return "success";
    case "CLOSED":
      return "muted";
    default:
      return "default";
  }
}

export const HANDOFF_STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
