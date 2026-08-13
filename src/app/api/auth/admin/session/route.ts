import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isStaff } from "@/server/rbac";
import { ADMIN_PORTAL_COOKIE, adminPortalCookieOptions } from "@/lib/auth/admin-session";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staff = await isStaff(user.id);
  if (!staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_PORTAL_COOKIE, "1", adminPortalCookieOptions);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_PORTAL_COOKIE, "", {
    ...adminPortalCookieOptions,
    maxAge: 0,
  });
  return response;
}
