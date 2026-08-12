import { AdminShell } from "@/components/admin/layout/AdminShell";

// The dashboard is session-scoped and reads live operational data, so it must
// never be prerendered at build time.
export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
