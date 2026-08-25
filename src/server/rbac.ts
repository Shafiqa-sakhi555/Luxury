import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getStaffRoleFromMetadata,
  hasStaffRoleFromRows,
  type StaffRole,
} from "@/lib/auth/staff";

export type AdminContext = {
  user: { id: string; email?: string };
  permissions: Set<string>;
  roleNames: string[];
  primaryRole: string;
};

export function hasAnyPermission(permissions: Set<string>, required: readonly string[]) {
  if (required.length === 0) return true;
  if (permissions.has("*")) return true;
  return required.some((permission) => permissions.has(permission));
}

export function canWriteProducts(permissions: Set<string>) {
  return hasAnyPermission(permissions, ["product.write"]);
}

export function canDeleteProducts(permissions: Set<string>) {
  return hasAnyPermission(permissions, ["product.delete"]);
}

export function canWriteCatalog(permissions: Set<string>) {
  return hasAnyPermission(permissions, ["catalog.write"]);
}

export function canWriteOrders(permissions: Set<string>) {
  return hasAnyPermission(permissions, ["order.write"]);
}

export class AuthorizationError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

const ROLE_DEFAULT_PERMISSIONS: Record<StaffRole, string[]> = {
  "Super Admin": ["*"],
  Admin: [
    "catalog.write",
    "catalog.delete",
    "category.write",
    "product.write",
    "product.delete",
    "order.read",
    "order.write",
    "customer.read",
    "inventory.read",
    "inventory.write",
    "settings.write",
    "refunds.create",
    "refunds.view",
    "invoices.view",
  ],
  Finance: [
    "order.read",
    "finance.read",
    "finance.dashboard.view",
    "transactions.view",
    "payments.view",
    "refunds.view",
    "refunds.approve",
    "refunds.reject",
    "invoices.view",
    "invoices.download",
    "payouts.view",
    "settlements.view",
    "reconciliation.view",
    "reconciliation.manage",
    "financial_reports.view",
    "financial_reports.export",
    "customer.read",
  ],
};

type RoleJoin = { name: string } | { name: string }[] | null;

function roleNamesFromJoin(roles: RoleJoin): string[] {
  if (!roles) return [];
  if (Array.isArray(roles)) {
    return roles.map((role) => role.name).filter(Boolean);
  }
  return roles.name ? [roles.name] : [];
}

async function getUserRoleNames(userId: string): Promise<string[]> {
  const supabase = createSupabaseAdminClient();
  const { data: rows } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);

  if (!rows?.length) return [];

  return rows.flatMap((row) => roleNamesFromJoin(row.roles as RoleJoin));
}

export async function getUserPermissions(userId: string): Promise<Set<string>> {
  const supabase = createSupabaseAdminClient();
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role_id, roles(role_permissions(permissions(key)))")
    .eq("user_id", userId);

  const keys = new Set<string>();
  if (userRoles) {
    for (const ur of userRoles) {
      const role = ur.roles as
        | { role_permissions?: Array<{ permissions?: { key?: string } | null }> }
        | null;
      if (role?.role_permissions) {
        for (const rp of role.role_permissions) {
          if (rp.permissions?.key) {
            keys.add(rp.permissions.key);
          }
        }
      }
    }
  }

  if (keys.size === 0) {
    const roleNames = await getUserRoleNames(userId);
    for (const roleName of roleNames) {
      const defaults = ROLE_DEFAULT_PERMISSIONS[roleName as StaffRole];
      if (defaults) {
        defaults.forEach((key) => keys.add(key));
      }
    }
  }

  return keys;
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  if (perms.has("*")) return true;
  return perms.has(permission);
}

export async function requirePermission(permission: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new AuthorizationError("Unauthorized");
  }

  const allowed = await hasPermission(user.id, permission);
  if (!allowed) {
    throw new AuthorizationError("Forbidden");
  }
  return user;
}

export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return null;

  const permissions = await getUserPermissions(user.id);
  const roleNames = await getUserRoleNames(user.id);
  const metadataRole = getStaffRoleFromMetadata(user.app_metadata as Record<string, unknown>);
  const primaryRole = roleNames[0] ?? metadataRole ?? "Staff";

  return {
    user: { id: user.id, email: user.email },
    permissions,
    roleNames,
    primaryRole,
  };
}

export async function requireAuth() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  if (hasStaffRoleFromRows(roles)) {
    return true;
  }

  const {
    data: { user },
  } = await supabase.auth.admin.getUserById(userId);

  if (!user) return false;

  return Boolean(getStaffRoleFromMetadata(user.app_metadata));
}
