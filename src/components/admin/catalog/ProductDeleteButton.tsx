"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminButton } from "@/components/admin/ui";
import { removeProductAction } from "@/server/catalog/admin-actions";

export function ProductDeleteButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <AdminButton type="button" variant="destructive" onClick={() => setConfirming(true)}>
        Remove product
      </AdminButton>
    );
  }

  return (
    <div className="rounded-lg border border-red/20 bg-red/5 p-4">
      <p className="text-sm text-navy">
        Delete <span className="font-medium">{name}</span> permanently? This removes the product,
        its images, variants, and inventory from the catalog.
      </p>
      {error && <p className="mt-2 text-xs text-red">{error}</p>}
      <div className="mt-3 flex gap-2">
        <AdminButton
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await removeProductAction({ id });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              router.push("/admin/catalog/products");
              router.refresh();
            });
          }}
        >
          {pending ? "Removing..." : "Yes, remove"}
        </AdminButton>
        <AdminButton type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </AdminButton>
      </div>
    </div>
  );
}
