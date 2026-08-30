"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseOrderNumber } from "@/lib/orders/number";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PackageSearch } from "lucide-react";

export function TrackOrderForm({
  initialValue = "",
  compact = false,
}: {
  initialValue?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const orderNumber = parseOrderNumber(value) ?? extractLoose(value);
    if (!orderNumber) {
      setError("Enter a valid order ID, for example JHS-853457-Q5QNGL.");
      return;
    }
    setError(null);
    router.push(`/track/${encodeURIComponent(orderNumber)}`);
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "space-y-2" : "space-y-3"}>
      <div className={compact ? "flex gap-2" : "flex flex-col gap-3 sm:flex-row"}>
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="JHS-853457-Q5QNGL"
          aria-label="Order ID"
          className="h-12 flex-1"
          autoCapitalize="characters"
        />
        <Button type="submit" size="lg" className="h-12 shrink-0">
          <PackageSearch className="h-4 w-4" />
          Trace order
        </Button>
      </div>
      {error ? <p className="text-sm text-red">{error}</p> : null}
    </form>
  );
}

function extractLoose(value: string) {
  const match = value.trim().match(/\b(JHS-\d+-[A-Z0-9]+)\b/i);
  return match ? match[1].toUpperCase() : null;
}
