import Link from "next/link";
import { cn } from "@/lib/utils";

export function AdminTable({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function AdminTableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-navy/10 bg-[#FAFBFD] text-left text-xs uppercase tracking-wide text-muted">
      {children}
    </thead>
  );
}

export function AdminTableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function AdminTableRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <tr className={cn("border-b border-navy/5 transition-colors hover:bg-navy/[0.02]", className)}>
      {children}
    </tr>
  );
}

export function AdminTableHead({
  className,
  children,
  align,
}: {
  className?: string;
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 font-medium",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </th>
  );
}

export function AdminTableCell({
  className,
  children,
  align,
}: {
  className?: string;
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "px-4 py-3",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </td>
  );
}

export function AdminTableEmpty({
  colSpan,
  title,
  description,
  action,
}: {
  colSpan: number;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center">
        <p className="font-medium text-navy">{title}</p>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        {action ? (
          <Link
            href={action.href}
            className="mt-4 inline-flex rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90"
          >
            {action.label}
          </Link>
        ) : null}
      </td>
    </tr>
  );
}

export function AdminTableToolbar({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-navy/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {children}
    </div>
  );
}
