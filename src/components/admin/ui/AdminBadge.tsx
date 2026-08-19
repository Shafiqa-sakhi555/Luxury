import { cn } from "@/lib/utils";

export type AdminBadgeTone = "default" | "success" | "warning" | "danger" | "muted" | "info";

export function AdminBadge({
  children,
  tone = "default",
  dot = false,
}: {
  children: React.ReactNode;
  tone?: AdminBadgeTone;
  dot?: boolean;
}) {
  const tones = {
    default: "bg-navy/10 text-navy",
    success: "bg-emerald/10 text-emerald",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red/10 text-red",
    muted: "bg-navy/5 text-muted",
    info: "bg-blue/10 text-blue",
  };

  const dotColors = {
    default: "bg-navy",
    success: "bg-emerald",
    warning: "bg-amber-500",
    danger: "bg-red",
    muted: "bg-muted",
    info: "bg-blue",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        tones[tone]
      )}
    >
      {dot ? (
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotColors[tone])} aria-hidden />
      ) : null}
      {children}
    </span>
  );
}
