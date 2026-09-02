import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ProductGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("product-grid", className)}>{children}</div>;
}
