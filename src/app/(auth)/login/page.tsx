import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { AuthFormSkeleton } from "@/components/ui/page-skeletons";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-navy/10 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-3xl text-navy">
            <span className="text-red">J</span>alal&apos;s
          </Link>
          <p className="mt-2 text-sm text-muted">Sign in to your account</p>
        </div>
        <Suspense fallback={<AuthFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
