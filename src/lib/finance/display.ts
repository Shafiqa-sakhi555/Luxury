import type { AdminBadgeTone } from "@/components/admin/ui/AdminBadge";

export function profileFromJoin(
  profiles: { name?: string | null; email?: string | null } | { name?: string | null; email?: string | null }[] | null | undefined
) {
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  return {
    name: profile?.name ?? null,
    email: profile?.email ?? null,
    label: profile?.name ?? profile?.email ?? "—",
  };
}

export function orderNumberFromJoin(
  orders: { order_number?: string } | { order_number?: string }[] | null | undefined
) {
  const order = Array.isArray(orders) ? orders[0] : orders;
  return order?.order_number ?? "—";
}

export function paymentStatusTone(status: string): AdminBadgeTone {
  switch (status) {
    case "SUCCESSFUL":
    case "COMPLETED":
    case "RECONCILED":
      return "success";
    case "PENDING":
    case "PENDING_FINANCE":
    case "PROCESSING":
      return "warning";
    case "FAILED":
    case "REJECTED":
    case "UNRECONCILED":
    case "DISPUTED":
      return "danger";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
    case "PARTIALLY_RECONCILED":
      return "info";
    case "CANCELLED":
      return "muted";
    default:
      return "default";
  }
}

export function formatFinanceStatus(status: string) {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function financeDatePresets() {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  return [
    { label: "Today", from: iso(today), to: iso(today) },
    {
      label: "Yesterday",
      from: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)),
      to: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)),
    },
    {
      label: "Last 7 days",
      from: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)),
      to: iso(today),
    },
    {
      label: "Last 30 days",
      from: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)),
      to: iso(today),
    },
    { label: "This month", from: iso(startOfMonth), to: iso(today) },
    { label: "Last month", from: iso(startOfLastMonth), to: iso(endOfLastMonth) },
  ];
}
