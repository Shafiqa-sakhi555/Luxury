import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";

export function CheckoutFooter() {
  return (
    <footer className="border-t border-navy/10 bg-white/80 py-6">
      <PageContainer width="narrow">
        <div className="flex flex-col items-center justify-between gap-3 text-center text-xs text-muted sm:flex-row sm:text-left">
          <p>Secure checkout · Nationwide delivery</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/shop" className="transition hover:text-navy">
              Continue shopping
            </Link>
            <Link href="/contact" className="transition hover:text-navy">
              Need help?
            </Link>
            <Link href="/delivery" className="transition hover:text-navy">
              Delivery info
            </Link>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
