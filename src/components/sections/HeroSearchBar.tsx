"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { heroContent } from "@/lib/homeContent";
import { extractOrderNumber, parseOrderNumber } from "@/lib/orders/number";

export function HeroSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const orderNumber = parseOrderNumber(query) ?? extractOrderNumber(query);
    if (!orderNumber) {
      setError("Enter your order ID, for example JHS-853457-Q5QNGL.");
      return;
    }
    setError(null);
    router.push(`/track/${encodeURIComponent(orderNumber)}`);
  }

  return (
    <form
      id="hero-search"
      role="search"
      aria-label="Trace order"
      className="scroll-mt-28"
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-white p-3 shadow-2xl shadow-ink/20 sm:gap-0 sm:rounded-full sm:p-2 sm:pl-5 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3 px-2 sm:px-3">
          <PackageSearch className="h-5 w-5 shrink-0 text-red" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
            }}
            placeholder={heroContent.trackPlaceholder}
            className="h-12 w-full min-w-0 bg-transparent text-sm text-ink placeholder:text-muted outline-none sm:h-14 sm:text-base"
            aria-label="Order ID"
            autoComplete="off"
          />
        </div>
        <Button
          type="submit"
          variant="default"
          size="lg"
          className="h-12 w-full shrink-0 sm:h-14 sm:w-auto sm:rounded-full sm:px-8"
        >
          <PackageSearch className="h-4 w-4" />
          {heroContent.trackButton}
        </Button>
      </div>
      {error ? (
        <p className="mt-3 text-center text-sm text-white/90" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
