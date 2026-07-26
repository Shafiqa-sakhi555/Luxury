import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-royal text-ivory hover:bg-royal/90 shadow-lg shadow-royal/25",
        gold: "gradient-gold text-midnight font-semibold hover:opacity-90 shadow-lg shadow-gold/25",
        outline:
          "border border-glass-border bg-transparent text-ivory hover:bg-glass hover:border-gold/40",
        ghost: "text-ivory/70 hover:text-ivory hover:bg-glass",
        glass: "glass text-ivory hover:bg-ivory/10",
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
