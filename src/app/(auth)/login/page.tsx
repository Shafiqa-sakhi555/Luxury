import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { AuthFormSkeleton } from "@/components/ui/page-skeletons";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AuthShell title="Sign in to your account">
      <Suspense fallback={<AuthFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
