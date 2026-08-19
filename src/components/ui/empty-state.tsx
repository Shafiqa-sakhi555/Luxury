import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-navy/60">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-xl font-medium text-navy">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-muted leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-6">
          {action.href ? (
            <Button asChild variant="default" size="default">
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button variant="default" size="default" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
