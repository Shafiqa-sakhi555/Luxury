"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders", exact: false },
  { href: "/account/addresses", label: "Addresses", exact: false },
  { href: "/account/wishlist", label: "Wishlist", exact: false },
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="space-y-1">
      {links.map((link) => {
        const active = isActive(pathname, link.href, link.exact);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "block rounded-xl px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-white font-medium text-navy shadow-sm ring-1 ring-navy/8"
                : "text-navy/70 hover:bg-white/70 hover:text-navy"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
