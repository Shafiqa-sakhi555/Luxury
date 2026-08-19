import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "./RegisterForm";
import { AuthFormSkeleton } from "@/components/ui/page-skeletons";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-navy/10 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-3xl text-navy">
            <span className="text-red">J</span>alal&apos;s
          </Link>
          <p className="mt-2 text-sm text-muted">Create your customer account</p>
        </div>
        <Suspense fallback={<AuthFormSkeleton />}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
