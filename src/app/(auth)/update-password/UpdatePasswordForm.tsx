"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completePasswordResetAction } from "@/server/auth/password-reset-actions";

export function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const portal = searchParams.get("portal") === "admin" ? "admin" : "customer";
  const loginHref = portal === "admin" ? "/admin/login" : "/login";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await completePasswordResetAction({ password, confirmPassword });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push(`${loginHref}?reset=success`);
    router.refresh();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy" htmlFor="new-password">
            New password
          </label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-muted">Use at least 8 characters.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy" htmlFor="confirm-password">
            Confirm new password
          </label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        {error ? <p className="text-sm text-red">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Save new password"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link href={loginHref} className="text-navy hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
