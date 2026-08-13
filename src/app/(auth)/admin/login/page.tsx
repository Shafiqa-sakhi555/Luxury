import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { AdminLoginForm } from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4">
      <div className="w-full max-w-md rounded-2xl border border-navy/10 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-3xl text-navy">
            <span className="text-red">J</span>alal&apos;s
          </Link>
          <p className="mt-2 text-sm text-muted">Admin dashboard sign in</p>
          <p className="mt-1 text-xs text-muted">
            For Super Admin, Admin, and Finance accounts
          </p>
        </div>
        <Suspense fallback={<div className="h-64" />}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
