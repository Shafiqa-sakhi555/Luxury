"use client";

import { cn } from "@/lib/utils";

type Option = {
  id: string;
  label: string;
  sublabel?: string | null;
};

export function ProductOptionSelector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "min-w-[88px] border px-4 py-3 text-left text-sm transition",
                active
                  ? "border-navy bg-navy text-white"
                  : "border-navy/20 bg-white text-navy hover:border-navy/50"
              )}
            >
              <span className="block font-medium leading-tight">{option.label}</span>
              {option.sublabel ? (
                <span
                  className={cn(
                    "mt-0.5 block text-[11px]",
                    active ? "text-white/75" : "text-muted"
                  )}
                >
                  {option.sublabel}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
