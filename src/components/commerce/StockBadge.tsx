import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type StockBadgeProps = {
  status: string | null | undefined;
  className?: string;
};

export function StockBadge({ status, className }: StockBadgeProps) {
  const inStock =
    status === "in_stock" || status === "unknown" || status === null || status === undefined;

  if (inStock) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-1 text-xs font-medium text-emerald",
          className
        )}
      >
        <Check className="h-3.5 w-3.5" aria-hidden />
        In stock
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-navy/10 px-3 py-1 text-xs font-medium text-navy/70",
        className
      )}
    >
      Out of stock
    </span>
  );
}
