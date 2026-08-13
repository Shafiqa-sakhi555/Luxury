import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";
import { getStaffRoleFromMetadata, hasStaffRoleFromRows } from "@/lib/auth/staff";
import { ADMIN_PORTAL_COOKIE } from "@/lib/auth/admin-session";

async function userIsStaff(
  supabase: ReturnType<typeof createServerClient>,
  user: { id: string; app_metadata?: Record<string, unknown> }
) {
  if (getStaffRoleFromMetadata(user.app_metadata)) {
    return true;
  }

  const { data: rpcResult, error: rpcError } = await supabase.rpc("user_is_staff");
  if (!rpcError && rpcResult === true) {
    return true;
  }

  const { data: roles } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id);

  return hasStaffRoleFromRows(roles);
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminLogin = pathname === "/admin/login";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAccountRoute = pathname.startsWith("/account");
  const hasAdminPortal = request.cookies.get(ADMIN_PORTAL_COOKIE)?.value === "1";

  if (isAdminLogin && user && hasAdminPortal) {
    const isStaff = await userIsStaff(supabase, user);
    if (isStaff) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (isAdminRoute && !isAdminLogin) {
    if (!user || !hasAdminPortal) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    const isStaff = await userIsStaff(supabase, user);
    if (!isStaff) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  if (!user && isAccountRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/account/:path*"],
};
