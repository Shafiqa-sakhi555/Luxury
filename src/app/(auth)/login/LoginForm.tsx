"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasStaffRoleFromRows, isStaffRole } from "@/lib/auth/staff";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createSupabaseBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    if (data.user) {
      const metadataRole = data.user.app_metadata?.role;
      let isStaff = typeof metadataRole === "string" && isStaffRole(metadataRole);

      if (!isStaff) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("roles(name)")
          .eq("user_id", data.user.id);

        isStaff = hasStaffRoleFromRows(roles);
      }

      if (callbackUrl.startsWith("/admin")) {
        if (isStaff) {
          const sessionResponse = await fetch("/api/auth/admin/session", { method: "POST" });
          if (!sessionResponse.ok) {
            await supabase.auth.signOut();
            router.push("/admin/login?error=unauthorized");
            router.refresh();
            return;
          }
          router.push(callbackUrl);
        } else {
          await supabase.auth.signOut();
          router.push("/admin/login?error=unauthorized");
        }
      } else if (isStaff && callbackUrl === "/") {
        const sessionResponse = await fetch("/api/auth/admin/session", { method: "POST" });
        if (!sessionResponse.ok) {
          await supabase.auth.signOut();
          router.push("/admin/login?error=unauthorized");
          router.refresh();
          return;
        }
        router.push("/admin");
      } else {
        router.push(callbackUrl);
      }
    } else {
      router.push(callbackUrl);
    }
    
    router.refresh();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
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
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        No account?{" "}
        <Link href="/register" className="text-navy hover:underline">
          Register
        </Link>
      </p>
    </>
  );
}
