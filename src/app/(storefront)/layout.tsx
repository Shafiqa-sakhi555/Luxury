import { AppShell } from "@/components/layout/AppShell";
import { listShopNavCategories } from "@/server/catalog/products";
import { buildCanonicalShopCategories } from "@/lib/catalog/shop-categories";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shopCategories = await listShopNavCategories().catch(() => buildCanonicalShopCategories());

  return (
    <div className="pattern-carpet bg-brand-50 text-ink min-h-screen">
      <AppShell shopCategories={shopCategories}>{children}</AppShell>
    </div>
  );
}
