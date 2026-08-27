import { NextResponse } from "next/server";
import { getAdminContext } from "@/server/rbac";
import {
  canViewOrderNotifications,
  listAdminOrderNotifications,
  markAdminOrderNotificationsSeen,
} from "@/server/admin/order-notifications";

export async function GET(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canViewOrderNotifications(ctx)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const seenHint = new URL(request.url).searchParams.get("seenAt");
  const data = await listAdminOrderNotifications(ctx.user.id, seenHint);
  return NextResponse.json(data);
}

export async function POST() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canViewOrderNotifications(ctx)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await markAdminOrderNotificationsSeen(ctx.user.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not mark notifications read." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
