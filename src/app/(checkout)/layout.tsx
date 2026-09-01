import { FlowSiteHeader } from "@/components/layout/FlowSiteHeader";
import { CheckoutFooter } from "@/components/layout/CheckoutFooter";
import { SkipLink } from "@/components/layout/SkipLink";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-luxury-cream text-ink">
      <SkipLink />
      <FlowSiteHeader badge="Secure checkout" />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <CheckoutFooter />
    </div>
  );
}
