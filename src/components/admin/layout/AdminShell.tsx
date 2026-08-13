"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  Settings,
  Menu,
  X,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/catalog/products", label: "Products", icon: Package },
  { href: "/admin/catalog/categories", label: "Categories", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const supabase = createSupabaseBrowserClient();

  const handleSignOut = async () => {
    await fetch("/api/auth/admin/session", { method: "DELETE" });
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-navy/10 px-4">
        {!collapsed && (
          <Link href="/admin" className="font-display text-lg text-navy">
            <span className="text-red">J</span>alal&apos;s Admin
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-md p-2 text-muted hover:bg-navy/5 lg:inline-flex"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn("h-4 w-4 transition", collapsed && "rotate-180")} />
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-md p-2 text-muted hover:bg-navy/5 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-navy text-white"
                  : "text-navy/70 hover:bg-navy/5 hover:text-navy"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-navy/10 p-3">
        <Link
          href="/"
          className="mb-2 block rounded-lg px-3 py-2 text-sm text-navy/70 hover:bg-navy/5"
        >
          View storefront
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red hover:bg-red/5"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-ink">
      <div className="brand-accent-bar" />
      <div className="flex min-h-[calc(100vh-4px)]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden border-r border-navy/10 bg-white transition-all lg:static lg:block",
            collapsed ? "w-[72px]" : "w-[260px]",
            mobileOpen && "block w-[260px] shadow-xl"
          )}
        >
          {sidebar}
        </aside>
        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close overlay"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-navy/10 bg-white/95 px-4 backdrop-blur">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-2 text-navy lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-sm text-muted">Operations dashboard</div>
            <div className="text-sm font-medium text-navy">Admin</div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
