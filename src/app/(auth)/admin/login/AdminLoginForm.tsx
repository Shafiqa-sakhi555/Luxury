"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tryCreateSupabaseBrowserClient } from "@/lib/supabase/client";
import { SupabaseSetupNotice } from "@/components/shared/SupabaseSetupNotice";
import { hasStaffRoleFromRows, isStaffRole } from "@/lib/auth/staff";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const unauthorized = searchParams.get("error") === "unauthorized";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(unauthorized ? "You do not have access to the admin dashboard." : "");
  const [loading, setLoading] = useState(false);

  const supabase = tryCreateSupabaseBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setError("");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    const metadataRole = data.user?.app_metadata?.role;
    let isStaff = typeof metadataRole === "string" && isStaffRole(metadataRole);

    if (!isStaff && data.user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", data.user.id);

      isStaff = hasStaffRoleFromRows(roles);
    }

    setLoading(false);

    if (!isStaff) {
      await supabase.auth.signOut();
      setError("This account does not have admin access.");
      return;
    }

    const sessionResponse = await fetch("/api/auth/admin/session", { method: "POST" });
    if (!sessionResponse.ok) {
      await supabase.auth.signOut();
      setError("Unable to start admin session. Please try again.");
      return;
    }

    router.push(callbackUrl.startsWith("/admin") ? callbackUrl : "/admin");
    router.refresh();
  }

  if (!supabase) {
    return <SupabaseSetupNotice />;
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">Admin email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="admin@jalals.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-sm text-red">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in to dashboard"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Customer account?{" "}
        <Link href="/login" className="text-navy hover:underline">
          Store sign in
        </Link>
      </p>
    </>
  );
}
