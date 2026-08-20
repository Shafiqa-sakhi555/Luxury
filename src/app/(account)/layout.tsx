import { AppShell } from "@/components/layout/AppShell";
import { AccountNav } from "@/components/account/AccountNav";
import { PageContainer } from "@/components/ui/page-container";
import { listShopNavCategories } from "@/server/catalog/products";
import { buildCanonicalShopCategories } from "@/lib/catalog/shop-categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shopCategories, supabase] = await Promise.all([
    listShopNavCategories().catch(() => buildCanonicalShopCategories()),
    createSupabaseServerClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="pattern-carpet min-h-screen bg-brand-50 text-ink">
      <AppShell shopCategories={shopCategories}>
        <PageContainer className="pb-16 pt-28 sm:pt-32">
          <div className="mb-8 flex flex-col gap-1 sm:mb-10">
            <h1 className="font-display text-2xl text-navy sm:text-3xl">My account</h1>
            {user?.email ? (
              <p className="text-sm text-muted">{user.email}</p>
            ) : null}
          </div>
          <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <AccountNav />
            </aside>
            <div className="min-w-0">{children}</div>
          </div>
        </PageContainer>
      </AppShell>
    </div>
  );
}
