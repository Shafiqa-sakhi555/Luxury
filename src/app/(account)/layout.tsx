import { AppShell } from "@/components/layout/AppShell";
import { AccountNav } from "@/components/account/AccountNav";
import { PageContainer } from "@/components/ui/page-container";
import { listShopNavCategories } from "@/server/catalog/products";
import { buildCanonicalShopCategories } from "@/lib/catalog/shop-categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStoreSettings } from "@/server/settings/store-settings";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shopCategories, supabase, settings] = await Promise.all([
    listShopNavCategories().catch(() => buildCanonicalShopCategories()),
    createSupabaseServerClient(),
    getStoreSettings(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="pattern-carpet min-h-screen bg-brand-50 text-ink">
      <AppShell
        shopCategories={shopCategories}
        freeDeliveryThresholdMinor={settings.freeDeliveryThresholdMinor}
      >
        <PageContainer className="pb-16 pt-28 sm:pt-32">
          <div className="mb-8 flex flex-col gap-1 sm:mb-10">
            <p className="eyebrow-pill w-fit">Account</p>
            <h1 className="font-display text-3xl tracking-tight text-navy sm:text-4xl">My account</h1>
            {user?.email ? (
              <p className="text-sm text-muted">{user.email}</p>
            ) : null}
          </div>
          <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-2xl border border-navy/8 bg-white/80 p-2 shadow-sm">
                <AccountNav />
              </div>
            </aside>
            <div className="min-w-0">{children}</div>
          </div>
        </PageContainer>
      </AppShell>
    </div>
  );
}
