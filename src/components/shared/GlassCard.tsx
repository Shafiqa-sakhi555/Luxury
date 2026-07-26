"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}

export function GlassCard({ children, className, strong }: GlassCardProps) {
  return (
    <div className={cn(strong ? "glass-strong" : "glass", "rounded-2xl", className)}>
      {children}
    </div>
  );
}
