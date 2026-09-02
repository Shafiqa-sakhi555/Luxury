import type { ReactNode } from "react";
import Link from "next/link";

export function AuthShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="auth-shell flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-navy/10 bg-white p-8 shadow-xl shadow-navy/10">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-3xl tracking-tight text-navy">
            <span className="text-red">J</span>alal&apos;s
          </Link>
          <p className="mt-2 text-sm text-muted">{title}</p>
          {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
