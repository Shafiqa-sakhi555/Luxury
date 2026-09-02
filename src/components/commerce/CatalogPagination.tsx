"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { getPaginationPages } from "@/lib/pagination-pages";

type CatalogPaginationProps = {
  page: number;
  totalPages: number;
  className?: string;
  onPageChange?: (page: number) => void;
  pathname?: string;
  query?: Record<string, string | undefined>;
};

function pageButtonClass(active: boolean) {
  return cn(
    "rounded-full px-4 py-2 text-sm transition",
    active
      ? "bg-red font-medium text-white shadow-md shadow-red/20"
      : "border border-navy/10 bg-white text-navy/70 hover:border-red/30 hover:bg-red/5"
  );
}

function hrefFor(
  pathname: string,
  query: Record<string, string | undefined>,
  page: number
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function CatalogPagination({
  page,
  totalPages,
  onPageChange,
  pathname,
  query = {},
  className,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;
  if (!onPageChange && !pathname) return null;

  const pages = getPaginationPages(page, totalPages);

  function renderControl(target: number, label: string, active = false) {
    const className = pageButtonClass(active);
    const ariaLabel = label === String(target) ? `Page ${target}` : label;

    if (onPageChange) {
      return (
        <button
          key={`${label}-${target}`}
          type="button"
          onClick={() => onPageChange(target)}
          aria-current={active ? "page" : undefined}
          aria-label={ariaLabel}
          className={className}
        >
          {label}
        </button>
      );
    }

    return (
      <Link
        key={`${label}-${target}`}
        href={hrefFor(pathname!, query, target)}
        aria-current={active ? "page" : undefined}
        aria-label={ariaLabel}
        className={className}
      >
        {label}
      </Link>
    );
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
    >
      {page > 1 ? renderControl(page - 1, "Previous") : null}
      {pages.map((p) => renderControl(p, String(p), p === page))}
      {page < totalPages ? renderControl(page + 1, "Next") : null}
    </nav>
  );
}
