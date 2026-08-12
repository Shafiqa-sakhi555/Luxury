import Link from "next/link";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-50 text-ink">
      <header className="border-b border-navy/10 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="font-display text-xl text-navy">
            <span className="text-red">J</span>alal&apos;s
          </Link>
          <span className="text-sm text-muted">Secure checkout</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
