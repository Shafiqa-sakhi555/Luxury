import { auth } from "@/lib/auth";
import { db } from "@/server/db";

export class AuthorizationError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function getUserPermissions(userId: string): Promise<Set<string>> {
  const userRoles = await db.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });

  const keys = new Set<string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.rolePermissions) {
      keys.add(rp.permission.key);
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
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthorizationError("Unauthorized");
  }
  const allowed = await hasPermission(session.user.id, permission);
  if (!allowed) {
    throw new AuthorizationError("Forbidden");
  }
  return session;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthorizationError("Unauthorized");
  }
  return session;
}

export async function isStaff(userId: string): Promise<boolean> {
  const roles = await db.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return roles.some((r) => r.role.name !== "Customer");
}
