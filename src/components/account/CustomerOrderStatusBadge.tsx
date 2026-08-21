import { customerOrderStatusLabel, customerOrderStatusTone } from "@/lib/orders/status";
import { cn } from "@/lib/utils";

export function CustomerOrderStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        customerOrderStatusTone(status),
        className
      )}
    >
      {customerOrderStatusLabel(status)}
    </span>
  );
}
