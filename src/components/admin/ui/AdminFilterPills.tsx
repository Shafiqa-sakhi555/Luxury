import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatStatusLabel } from "@/lib/admin/status-badges";

type FilterItem = {
  label: string;
  href: string;
  value?: string;
};

export function AdminFilterPills({
  items,
  activeValue,
}: {
  items: FilterItem[];
  activeValue?: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
      {items.map((item) => {
        const isActive =
          item.value === undefined
            ? activeValue === undefined || activeValue === ""
            : activeValue === item.value;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition sm:text-sm",
              isActive
                ? "bg-navy text-white shadow-sm"
                : "border border-navy/10 bg-white text-navy/70 hover:bg-navy/5 hover:text-navy"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function orderStatusFilterItems(currentStatus?: string): FilterItem[] {
  const statuses = [
    undefined,
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ] as const;

  return statuses.map((status) => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    const href = query.size ? `/admin/orders?${query.toString()}` : "/admin/orders";
    return {
      label: status ? formatStatusLabel(status) : "All",
      href,
      value: status,
    };
  });
}

export function handoffStatusFilterItems(currentStatus?: string): FilterItem[] {
  const statuses = [undefined, "PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

  return statuses.map((status) => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    const href = query.size ? `/admin/assistant?${query.toString()}` : "/admin/assistant";
    return {
      label: status ? formatStatusLabel(status) : "All",
      href,
      value: status,
    };
  });
}
