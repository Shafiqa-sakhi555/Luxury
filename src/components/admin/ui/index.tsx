import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const adminButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-navy text-white hover:bg-navy/90",
        outline: "border border-navy/15 bg-white text-navy hover:bg-navy/5",
        ghost: "text-navy/70 hover:bg-navy/5 hover:text-navy",
        destructive: "bg-red text-white hover:bg-red/90",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-5",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export function AdminButton({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof adminButtonVariants>) {
  return (
    <button className={cn(adminButtonVariants({ variant, size, className }))} {...props} />
  );
}

export function AdminInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-lg border border-navy/10 bg-white px-3 text-sm text-navy placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/20",
        className
      )}
      {...props}
    />
  );
}

export function AdminTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[96px] w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/20",
        className
      )}
      {...props}
    />
  );
}

export function AdminSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-9 w-full rounded-lg border border-navy/10 bg-white px-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function AdminLabel({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted", className)} {...props}>
      {children}
    </label>
  );
}

export { AdminBadge, type AdminBadgeTone } from "./AdminBadge";
export { AdminTable, AdminTableHeader, AdminTableBody, AdminTableRow, AdminTableHead, AdminTableCell, AdminTableEmpty, AdminTableToolbar } from "./AdminTable";
export { AdminPagination } from "./AdminPagination";
export { AdminFilterPills, orderStatusFilterItems, handoffStatusFilterItems } from "./AdminFilterPills";
export {
  OrderStatusBadge,
  ProductStatusBadge,
  StockStatusBadge,
  HandoffStatusBadge,
  AdminStatusBadge,
} from "./AdminStatusBadges";
