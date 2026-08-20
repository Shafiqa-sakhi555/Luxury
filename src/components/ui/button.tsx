import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-red text-white hover:bg-red/90 shadow-lg shadow-red/20",
        accent:
          "gradient-gold text-white font-semibold hover:opacity-90 shadow-lg shadow-red/20",
        /** @deprecated Use `accent` instead */
        gold: "gradient-gold text-white font-semibold hover:opacity-90 shadow-lg shadow-red/20",
        outline:
          "border border-navy/15 bg-transparent text-navy hover:bg-mist hover:border-blue/30",
        ghost: "text-navy/70 hover:text-navy hover:bg-mist",
        glass: "glass text-navy hover:bg-white",
        secondary:
          "border border-navy/15 bg-white text-navy hover:bg-mist",
      },
      size: {
        default: "h-10 px-5 py-2 sm:h-11 sm:px-6",
        sm: "h-8 px-3 text-xs sm:h-9 sm:px-4",
        lg: "h-11 px-6 text-sm sm:h-12 sm:px-8 sm:text-base",
        icon: "h-9 w-9 sm:h-10 sm:w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
