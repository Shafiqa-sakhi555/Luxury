import { db } from "@/server/db";
import { adminGetCatalogProductCounts } from "@/server/catalog/admin-queries";

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  ipAddress?: string;
}) {
  return db.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before ? (input.before as object) : undefined,
      after: input.after ? (input.after as object) : undefined,
      reason: input.reason,
      ipAddress: input.ipAddress,
    },
  });
}

export async function getDashboardSummary() {
  const [
    orderCounts,
    customerCount,
    lowStockCount,
    recentOrders,
    revenueResult,
    productCounts,
  ] = await Promise.all([
    db.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    db.customer.count(),
    db.inventoryBalance.count({
      where: {
        OR: [{ onHand: { lte: 5 } }],
      },
    }).catch(() => 0),
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: { include: { user: { select: { name: true, email: true } } } } },
    }),
    db.order.aggregate({
      _sum: { totalMinor: true },
      where: { status: { in: ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"] } },
    }),
    adminGetCatalogProductCounts().catch(() => ({
      published: 0,
      draft: 0,
      archived: 0,
      total: 0,
    })),
  ]);

  const pendingOrders = orderCounts.find((o) => o.status === "PENDING")?._count.id ?? 0;

  return {
    products: productCounts,
    orders: { pending: pendingOrders, total: orderCounts.reduce((a, b) => a + b._count.id, 0) },
    customers: customerCount,
    revenueMinor: revenueResult._sum.totalMinor ?? 0,
    lowStockCount,
    recentOrders,
  };
}
