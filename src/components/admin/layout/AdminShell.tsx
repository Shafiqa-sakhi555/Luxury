"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  Settings,
  MessageCircle,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  Landmark,
  Receipt,
  ArrowLeftRight,
  FileText,
  Wallet,
  Scale,
  BarChart3,
  MapPin,
  LayoutGrid,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SkipLink } from "@/components/layout/SkipLink";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { tryCreateSupabaseBrowserClient } from "@/lib/supabase/client";
import { ADMIN_NAV } from "@/lib/auth/admin-access";
import { AdminAccountMenu, type AdminAccount } from "@/components/admin/layout/AdminAccountMenu";
import { AdminOrderBell } from "@/components/admin/layout/AdminOrderBell";

const ICONS: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/catalog/products": Package,
  "/admin/catalog/categories": Package,
  "/admin/branches": MapPin,
  "/admin/shop-styles": LayoutGrid,
  "/admin/reviews": Star,
  "/admin/orders": ShoppingCart,
  "/admin/finance": Landmark,
  "/admin/finance/transactions": ArrowLeftRight,
  "/admin/finance/refunds": Receipt,
  "/admin/finance/invoices": FileText,
  "/admin/finance/payouts": Wallet,
  "/admin/finance/reconciliation": Scale,
  "/admin/finance/reports": BarChart3,
  "/admin/inventory": Warehouse,
  "/admin/customers": Users,
  "/admin/assistant": MessageCircle,
  "/admin/settings": Settings,
};

type AdminShellProps = {
  children: React.ReactNode;
  allowedHrefs: string[];
  account: AdminAccount;
};

export function AdminShell({ children, allowedHrefs, account }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileNavRef = useRef<HTMLElement>(null);

  useFocusTrap(mobileNavRef, mobileOpen, () => setMobileOpen(false));

  const allowed = new Set(allowedHrefs);
  const nav = ADMIN_NAV.filter((item) => allowed.has(item.href));

  const handleSignOut = async () => {
    await fetch("/api/auth/admin/session", { method: "DELETE" });
    const supabase = tryCreateSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-[#0e1024] text-white">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {!collapsed && (
          <Link href="/admin" className="font-display text-lg tracking-tight">
            <span className="text-red">J</span>alal&apos;s Admin
          </Link>
        )}
        {collapsed && (
          <Link href="/admin" className="font-display text-xl text-red" aria-label="Admin home">
            J
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-lg p-2 text-white/60 hover:bg-white/8 hover:text-white lg:inline-flex"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn("h-4 w-4 transition", collapsed && "rotate-180")} />
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-2 text-white/60 hover:bg-white/8 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin">
        {nav.map(({ href, label }) => {
          const Icon = ICONS[href] ?? LayoutDashboard;
          const active =
            pathname === href ||
            (href !== "/admin" && href !== "/admin/finance" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                collapsed && "justify-center px-0",
                active
                  ? "bg-white/12 text-white shadow-sm ring-1 ring-white/10"
                  : "text-white/65 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-red")} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          className={cn(
            "mb-1 block rounded-xl px-3 py-2 text-sm text-white/65 hover:bg-white/8 hover:text-white",
            collapsed && "text-center"
          )}
        >
          {collapsed ? "Shop" : "View storefront"}
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red/90 hover:bg-red/10",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-[#F4F6FB] text-ink">
      <SkipLink />
      <div className="brand-accent-bar shrink-0" />
      <div className="flex min-h-0 flex-1">
        <aside
          ref={mobileNavRef}
          className={cn(
            "z-40 hidden overflow-hidden transition-all",
            "fixed inset-y-0 left-0 lg:static lg:flex lg:h-full lg:shrink-0",
            collapsed ? "w-[72px]" : "w-[260px]",
            mobileOpen && "flex w-[260px] shadow-2xl"
          )}
        >
          {sidebar}
        </aside>
        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close overlay"
          />
        )}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-navy/8 bg-white/90 px-4 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-2 text-navy lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                Staff portal
              </p>
              <p className="hidden text-sm text-navy sm:block">Jalal&apos;s Home Solution</p>
            </div>
            <div className="flex items-center gap-1">
              {account.role === "Super Admin" || account.role === "Admin" ? <AdminOrderBell /> : null}
              <AdminAccountMenu account={account} />
            </div>
          </header>
          <main
            id="main-content"
            tabIndex={-1}
            className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
