"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red">Something went wrong</p>
      <h1 className="mt-3 font-display text-3xl text-navy sm:text-4xl">We could not load this page</h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        Please try again. If the problem continues, return to the homepage or browse the shop.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/shop">Browse shop</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
