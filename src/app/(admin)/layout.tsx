import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { ADMIN_NAV } from "@/lib/auth/admin-access";
import { getAdminContext, hasAnyPermission } from "@/server/rbac";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");

  const allowedHrefs = ADMIN_NAV.filter((item) =>
    hasAnyPermission(ctx.permissions, item.permissions)
  ).map((item) => item.href);

  if (allowedHrefs.length === 0) {
    redirect("/admin/login");
  }

  return (
    <AdminShell allowedHrefs={allowedHrefs} roleLabel={ctx.primaryRole}>
      {children}
    </AdminShell>
  );
}
