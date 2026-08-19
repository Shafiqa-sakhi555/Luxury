import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: "sm" | "md" | "lg" | "full";
}

const roundedMap = {
  sm: "rounded-md",
  md: "rounded-xl",
  lg: "rounded-2xl",
  full: "rounded-full",
} as const;

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, rounded = "md", ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "skeleton bg-navy/8",
        roundedMap[rounded],
        className
      )}
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
