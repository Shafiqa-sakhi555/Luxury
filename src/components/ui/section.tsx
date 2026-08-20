import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sectionVariants = cva("", {
  variants: {
    spacing: {
      none: "",
      sm: "section-spacing-sm",
      md: "section-spacing-md",
      lg: "section-spacing-lg",
    },
    tone: {
      default: "bg-transparent",
      muted: "bg-mist",
      dark: "bg-navy text-text-on-dark",
      cream: "bg-luxury-cream",
    },
  },
  defaultVariants: {
    spacing: "md",
    tone: "default",
  },
});

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  as?: "section" | "div";
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing, tone, as: Comp = "section", ...props }, ref) => (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn(sectionVariants({ spacing, tone }), className)}
      {...props}
    />
  )
);
Section.displayName = "Section";

export { Section, sectionVariants };
