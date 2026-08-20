import Link from "next/link";
import { cn } from "@/lib/utils";
import { getPaginationPages } from "@/lib/pagination-pages";

type CatalogPaginationProps = {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
};

export function CatalogPagination({
  page,
  totalPages,
  buildHref,
  className,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPaginationPages(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
    >
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          className="rounded-full border border-navy/10 bg-white px-4 py-2 text-sm text-navy/70 transition hover:border-red/30 hover:bg-red/5"
        >
          Previous
        </Link>
      ) : null}

      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-2 text-sm transition",
            p === page
              ? "bg-red font-medium text-white shadow-md shadow-red/20"
              : "border border-navy/10 bg-white text-navy/70 hover:border-red/30 hover:bg-red/5"
          )}
        >
          {p}
        </Link>
      ))}

      {page < totalPages ? (
        <Link
          href={buildHref(page + 1)}
          className="rounded-full border border-navy/10 bg-white px-4 py-2 text-sm text-navy/70 transition hover:border-red/30 hover:bg-red/5"
        >
          Next
        </Link>
      ) : null}
    </nav>
  );
}
