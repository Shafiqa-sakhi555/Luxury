import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasStaffRoleFromRows } from "@/lib/auth/staff";

export class AuthorizationError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function getUserPermissions(userId: string): Promise<Set<string>> {
  const supabase = await createSupabaseServerClient();
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role_id, roles(role_permissions(permissions(key)))")
    .eq("user_id", userId);

  const keys = new Set<string>();
  if (userRoles) {
    for (const ur of userRoles) {
      const role: any = ur.roles;
      if (role && role.role_permissions) {
        for (const rp of role.role_permissions) {
          if (rp.permissions?.key) {
            keys.add(rp.permissions.key);
          }
        }
      }
    }
  }
  return keys;
}

export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  if (perms.has("*")) return true;
  return perms.has(permission);
}

export async function requirePermission(permission: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new AuthorizationError("Unauthorized");
  }
  const allowed = await hasPermission(user.id, permission);
  if (!allowed) {
    throw new AuthorizationError("Forbidden");
  }
  return user;
}

export async function requireAuth() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new AuthorizationError("Unauthorized");
  }
  return user;
}

export async function isStaff(userId: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { data: roles } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);

  return hasStaffRoleFromRows(roles);
}
