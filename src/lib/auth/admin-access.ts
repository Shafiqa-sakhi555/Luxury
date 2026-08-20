export type AdminNavItem = {
  href: string;
  label: string;
  /** User needs at least one of these permissions (Super Admin `*` satisfies all). */
  permissions: string[];
};

export const ADMIN_NAV: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    permissions: ["order.read", "finance.read", "product.write", "inventory.read", "customer.read"],
  },
  { href: "/admin/catalog/products", label: "Products", permissions: ["product.write"] },
  { href: "/admin/catalog/categories", label: "Categories", permissions: ["catalog.write"] },
  { href: "/admin/orders", label: "Orders", permissions: ["order.read"] },
  { href: "/admin/inventory", label: "Inventory", permissions: ["inventory.read"] },
  { href: "/admin/customers", label: "Customers", permissions: ["customer.read"] },
  { href: "/admin/assistant", label: "Assistant", permissions: ["customer.read"] },
  { href: "/admin/settings", label: "Settings", permissions: ["*"] },
];

export const ADMIN_ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/admin": ADMIN_NAV[0].permissions,
  "/admin/catalog/products": ["product.write"],
  "/admin/catalog/categories": ["catalog.write"],
  "/admin/orders": ["order.read"],
  "/admin/inventory": ["inventory.read"],
  "/admin/customers": ["customer.read"],
  "/admin/assistant": ["customer.read"],
  "/admin/settings": ["*"],
};

export function resolveRoutePermissions(pathname: string): string[] | null {
  if (pathname === "/admin") return ADMIN_ROUTE_PERMISSIONS["/admin"];

  const match = Object.entries(ADMIN_ROUTE_PERMISSIONS)
    .filter(([route]) => route !== "/admin")
    .sort((a, b) => b[0].length - a[0].length)
    .find(([route]) => pathname === route || pathname.startsWith(`${route}/`));

  return match?.[1] ?? null;
}

export const ORDER_STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
