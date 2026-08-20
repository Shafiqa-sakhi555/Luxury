import { FlowSiteHeader } from "@/components/layout/FlowSiteHeader";
import { CheckoutFooter } from "@/components/layout/CheckoutFooter";
import { SkipLink } from "@/components/layout/SkipLink";
import { PageContainer } from "@/components/ui/page-container";
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pattern-carpet flex min-h-screen flex-col bg-brand-50 text-ink">
      <SkipLink />
      <FlowSiteHeader badge="Secure checkout" />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <PageContainer width="narrow" className="py-8 sm:py-10">
          {children}
        </PageContainer>
      </main>
      <CheckoutFooter />
    </div>
  );
}
