export const ADMIN_PORTAL_COOKIE = "jalals_admin_portal";

export const adminPortalCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  // Session cookie — cleared when the browser closes.
};
