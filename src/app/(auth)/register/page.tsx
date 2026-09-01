import { Suspense } from "react";
import { RegisterForm } from "./RegisterForm";
import { AuthFormSkeleton } from "@/components/ui/page-skeletons";
import { AuthShell } from "@/components/auth/AuthShell";

export default function RegisterPage() {
  return (
    <AuthShell title="Create your customer account">
      <Suspense fallback={<AuthFormSkeleton />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
