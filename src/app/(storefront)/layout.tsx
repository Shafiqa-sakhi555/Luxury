import { AppShell } from "@/components/layout/AppShell";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pattern-carpet bg-brand-50 text-ink min-h-screen">
      <AppShell>{children}</AppShell>
    </div>
  );
}
