import { Suspense } from "react";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { AuthFormSkeleton } from "@/components/ui/page-skeletons";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string }>;
}) {
  const params = await searchParams;
  const portal = params.portal === "admin" ? "admin" : "customer";

  return (
    <AuthShell
      title={portal === "admin" ? "Reset your admin password" : "Reset your password"}
      description="Enter the email for your account and we'll send a reset link."
    >
      <Suspense fallback={<AuthFormSkeleton />}>
        <ForgotPasswordForm portal={portal} />
      </Suspense>
    </AuthShell>
  );
}
