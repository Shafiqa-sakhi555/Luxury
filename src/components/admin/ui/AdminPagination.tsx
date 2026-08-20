import Link from "next/link";
import { cn } from "@/lib/utils";
import { getPaginationPages } from "@/lib/pagination-pages";

type AdminPaginationProps = {
  page: number;
  totalPages: number;
  total?: number;
  pageSize?: number;
  buildHref: (page: number) => string;
  className?: string;
};

export function AdminPagination({
  page,
  totalPages,
  total,
  pageSize,
  buildHref,
  className,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const start = total && pageSize ? (page - 1) * pageSize + 1 : null;
  const end = total && pageSize ? Math.min(page * pageSize, total) : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-navy/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-sm text-muted">
        {start && end && total ? (
          <>
            Showing {start}–{end} of {total}
          </>
        ) : (
          <>Page {page} of {totalPages}</>
        )}
      </p>

      <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="rounded-lg border border-navy/10 px-3 py-1.5 text-sm text-navy/70 transition hover:bg-navy/5"
          >
            Previous
          </Link>
        ) : null}

        {getPaginationPages(page, totalPages, 7).map((pageNum) => (
          <Link
            key={pageNum}
            href={buildHref(pageNum)}
            aria-current={pageNum === page ? "page" : undefined}
            className={cn(
              "min-w-[2.25rem] rounded-lg px-3 py-1.5 text-center text-sm transition",
              pageNum === page
                ? "bg-navy font-medium text-white"
                : "border border-navy/10 text-navy/70 hover:bg-navy/5"
            )}
          >
            {pageNum}
          </Link>
        ))}

        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            className="rounded-lg border border-navy/10 px-3 py-1.5 text-sm text-navy/70 transition hover:bg-navy/5"
          >
            Next
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
