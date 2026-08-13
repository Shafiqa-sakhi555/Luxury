export const STAFF_ROLES = ["Super Admin", "Admin", "Finance"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return Boolean(role && STAFF_ROLES.includes(role as StaffRole));
}

export function getStaffRoleFromMetadata(metadata: Record<string, unknown> | undefined) {
  const role = metadata?.role;
  return typeof role === "string" && isStaffRole(role) ? role : null;
}

export function hasStaffRoleFromRows(
  rows: Array<{ roles: { name: string } | { name: string }[] | null }> | null | undefined
) {
  if (!rows?.length) return false;

  return rows.some((row) => {
    const roles = row.roles;
    if (!roles) return false;
    if (Array.isArray(roles)) {
      return roles.some((role) => isStaffRole(role.name));
    }
    return isStaffRole(roles.name);
  });
}
