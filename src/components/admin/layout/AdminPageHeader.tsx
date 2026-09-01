import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-light tracking-tight text-navy sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function AdminCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("dashboard-card", className)}>
      {children}
    </div>
  );
}

const STAT_TONES = {
  navy: "bg-navy/8 text-navy",
  red: "bg-red/8 text-red",
  emerald: "bg-emerald/10 text-emerald",
  blue: "bg-blue/10 text-blue",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "navy",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <AdminCard className="relative overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red via-blue to-cyan" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-light tabular-nums text-navy">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        {icon ? (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              STAT_TONES[tone]
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </AdminCard>
  );
}
