"use client";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAssistantSafe } from "@/contexts/AssistantContext";

type OpenAssistantButtonProps = Omit<ButtonProps, "onClick"> & {
  prompt?: string;
  href?: string;
};

export function OpenAssistantButton({
  prompt,
  href,
  children,
  className,
  ...props
}: OpenAssistantButtonProps) {
  const assistant = useAssistantSafe();

  if (!assistant) {
    if (href) {
      return (
        <Button asChild className={className} {...props}>
          <a href={href}>{children}</a>
        </Button>
      );
    }
    return (
      <Button className={className} {...props}>
        {children}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      className={cn(className)}
      onClick={() => assistant.openAssistant(prompt ? { prompt } : undefined)}
      {...props}
    >
      {children}
    </Button>
  );
}
