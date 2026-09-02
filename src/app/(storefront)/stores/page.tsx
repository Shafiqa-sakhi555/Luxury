import type { Metadata } from "next";
import Link from "next/link";
import { listActiveStorefrontBranches } from "@/server/stores/queries";
import { groupLocatorBranches, toStoreLocatorBranch } from "@/lib/store-locator";
import { StoreLocatorCard } from "@/components/stores/StoreLocatorCard";
import { Button } from "@/components/ui/button";
import { OpenAssistantButton } from "@/components/assistant/OpenAssistantButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store Locator",
  description:
    "Showrooms across Gilgit-Baltistan — carpets, rugs, furniture, flooring and home décor.",
};

export default async function StoresPage() {
  const stores = await listActiveStorefrontBranches().catch(() => []);
  const locatorBranches = stores.map(toStoreLocatorBranch);
  const byRegion = groupLocatorBranches(locatorBranches);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-navy/10 section-brand-light pb-12 pt-[calc(var(--site-header-height)+2.5rem)] sm:pb-16 sm:pt-[calc(var(--site-header-height-sm)+3rem)]">
        <div className="blob-red left-0 top-10 h-64 w-64 opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow-pill">Visit us</p>
          <h1 className="mt-4 font-display text-4xl tracking-tight text-navy sm:text-5xl">
            {locatorBranches.length} Showrooms Across Gilgit-Baltistan
          </h1>
          <p className="mt-4 max-w-2xl text-muted">
            Explore carpets, rugs, furniture, flooring and home décor in person. Each branch is
            staffed by specialists who can help with sizing, custom orders and installation.
          </p>
          {locatorBranches.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {locatorBranches.map((branch) => (
                <a
                  key={branch.id}
                  href={`#${branch.id}`}
                  className="rounded-full bg-brand-50 px-4 py-2 text-sm text-navy ring-1 ring-navy/10 transition hover:bg-navy hover:text-white"
                >
                  {branch.city}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        {locatorBranches.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-muted ring-1 ring-navy/8">
            Showrooms will appear here once branches are added in the admin panel.
          </p>
        ) : (
          Object.entries(byRegion).map(([region, regionBranches]) => (
            <section key={region}>
              <h2 className="font-display text-2xl text-navy">{region}</h2>
              <div className="mt-6 space-y-8">
                {regionBranches.map((branch) => (
                  <StoreLocatorCard key={branch.id} branch={branch} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <section className="border-t border-navy/10 bg-brand-50 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl text-navy">Need help choosing?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Book a free consultation or send us a message — we respond within one business day.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <OpenAssistantButton
              prompt="I'd like a free design consultation for my home"
              size="lg"
            >
              Book free consultation
            </OpenAssistantButton>
            <Button asChild variant="outline">
              <Link href="/contact">Contact us</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/shop">Browse online</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
