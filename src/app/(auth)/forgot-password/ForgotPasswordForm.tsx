"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/server/auth/password-reset-actions";

export function ForgotPasswordForm({ portal = "customer" }: { portal?: "admin" | "customer" }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const result = await requestPasswordResetAction({
      email,
      portal,
      origin: window.location.origin,
    });

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(result.message);
  }

  const loginHref = portal === "admin" ? "/admin/login" : "/login";

  return (
    <>
      {message ? (
        <div className="rounded-xl border border-emerald/20 bg-emerald/5 px-4 py-3 text-sm text-navy">
          {message}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-navy" htmlFor="reset-email">
              Email
            </label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder={portal === "admin" ? "admin@jalals.com" : "you@example.com"}
            />
          </div>
          {error ? <p className="text-sm text-red">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href={loginHref} className="text-navy hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
