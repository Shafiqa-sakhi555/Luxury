import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminLoginForm } from "./AdminLoginForm";
import { AuthFormSkeleton } from "@/components/ui/page-skeletons";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <AuthShell
      title="Admin dashboard sign in"
      description="For Super Admin, Admin, and Finance accounts"
    >
      <Suspense fallback={<AuthFormSkeleton />}>
        <AdminLoginForm />
      </Suspense>
    </AuthShell>
  );
}
