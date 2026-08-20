import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const pageContainerVariants = cva("mx-auto w-full px-4 sm:px-6 lg:px-8", {
  variants: {
    width: {
      default: "max-w-7xl",
      narrow: "max-w-5xl",
      wide: "max-w-[90rem]",
      full: "max-w-none",
    },
  },
  defaultVariants: {
    width: "default",
  },
});

export interface PageContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageContainerVariants> {}

const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, width, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(pageContainerVariants({ width }), className)}
      {...props}
    />
  )
);
PageContainer.displayName = "PageContainer";

export { PageContainer, pageContainerVariants };
