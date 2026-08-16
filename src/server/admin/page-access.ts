import { redirect } from "next/navigation";
import { getAdminContext, hasAnyPermission } from "@/server/rbac";

export async function requireAdminPageAccess(...permissions: string[]) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");

  if (permissions.length > 0 && !hasAnyPermission(ctx.permissions, permissions)) {
    redirect("/admin?access=denied");
  }

  return ctx;
}
