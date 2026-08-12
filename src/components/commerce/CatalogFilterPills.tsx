import Link from "next/link";
import { cn } from "@/lib/utils";

type FilterItem = {
  label: string;
  href: string;
  slug?: string;
};

export function CatalogFilterPills({
  items,
  activeSlug,
}: {
  items: FilterItem[];
  activeSlug?: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar sm:flex-wrap sm:gap-3">
      {items.map((item) => {
        const isActive =
          item.slug === undefined
            ? activeSlug === undefined || activeSlug === ""
            : activeSlug === item.slug;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs transition-all duration-300 sm:px-5 sm:text-sm",
              isActive
                ? "bg-red font-medium text-white shadow-md shadow-red/20"
                : "border border-navy/10 bg-white text-navy/70 hover:border-red/30 hover:bg-red/5 hover:text-navy"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
