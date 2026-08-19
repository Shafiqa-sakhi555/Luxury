import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type ProductSpec = {
  label: string;
  value: string;
};

export function ProductSpecsGrid({ specs }: { specs: ProductSpec[] }) {
  if (specs.length === 0) return null;

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {specs.map(({ label, value }) => (
        <Card key={label} padding="sm" variant="muted">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            {label}
          </dt>
          <dd className="mt-1.5 text-sm leading-relaxed text-navy">{value}</dd>
        </Card>
      ))}
    </dl>
  );
}

export function ProductTrustStrip({
  items,
}: {
  items: Array<{ icon: LucideIcon; label: string }>;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {items.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-xs text-navy/80 ring-1 ring-navy/6"
        >
          <Icon className="h-4 w-4 shrink-0 text-red" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}
