import { AppShell } from "@/components/layout/AppShell";
import { listShopNavCategories } from "@/server/catalog/products";
import { buildCanonicalShopCategories } from "@/lib/catalog/shop-categories";
import { getStoreSettings } from "@/server/settings/store-settings";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shopCategories, settings] = await Promise.all([
    listShopNavCategories().catch(() => buildCanonicalShopCategories()),
    getStoreSettings(),
  ]);

  return (
    <div className="pattern-carpet bg-brand-50 text-ink min-h-screen">
      <AppShell
        shopCategories={shopCategories}
        freeDeliveryThresholdMinor={settings.freeDeliveryThresholdMinor}
      >
        {children}
      </AppShell>
    </div>
  );
}
