"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin/finance", label: "Dashboard", exact: true },
  { href: "/admin/finance/transactions", label: "Transactions" },
  { href: "/admin/finance/refunds", label: "Refunds" },
  { href: "/admin/finance/invoices", label: "Invoices" },
  { href: "/admin/finance/payouts", label: "Payouts" },
  { href: "/admin/finance/reconciliation", label: "Reconciliation" },
  { href: "/admin/finance/reports", label: "Reports" },
];

export function FinanceSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="mb-6 flex flex-wrap gap-2 border-b border-navy/10 pb-4"
      aria-label="Finance sections"
    >
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              active ? "bg-navy text-white" : "text-navy/70 hover:bg-navy/5 hover:text-navy"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
