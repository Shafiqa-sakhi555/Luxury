import { AppShell } from "@/components/layout/AppShell";
import { listShopFilterCategories } from "@/server/catalog/products";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shopCategories = await listShopFilterCategories().catch(() => []);

  return (
    <div className="pattern-carpet bg-brand-50 text-ink min-h-screen">
      <AppShell shopCategories={shopCategories}>{children}</AppShell>
    </div>
  );
}
