"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Heart,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Overview", exact: true, icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", exact: false, icon: Package },
  { href: "/account/addresses", label: "Addresses", exact: false, icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", exact: false, icon: Heart },
  { href: "/account/settings", label: "Settings", exact: false, icon: Settings },
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account"
      className="flex gap-1 overflow-x-auto pb-1 hide-scrollbar lg:flex-col lg:space-y-1 lg:overflow-visible lg:pb-0"
    >
      {links.map((link) => {
        const active = isActive(pathname, link.href, link.exact);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-navy font-medium text-white shadow-sm"
                : "text-navy/70 hover:bg-white hover:text-navy"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
