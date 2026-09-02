import { Suspense } from "react";
import type { Metadata } from "next";
import { UpdatePasswordForm } from "./UpdatePasswordForm";
import { AuthFormSkeleton } from "@/components/ui/page-skeletons";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default function UpdatePasswordPage() {
  return (
    <AuthShell title="Choose a new password">
      <Suspense fallback={<AuthFormSkeleton />}>
        <UpdatePasswordForm />
      </Suspense>
    </AuthShell>
  );
}
