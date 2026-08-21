"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminButton } from "@/components/admin/ui";
import { removeProductAction } from "@/server/catalog/admin-actions";

type ProductRowActionsProps = {
  id: string;
  name: string;
  canDelete?: boolean;
};

export function ProductRowActions({ id, name, canDelete = true }: ProductRowActionsProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="ml-auto max-w-xs rounded-lg border border-red/20 bg-red/5 p-3 text-right">
        <p className="text-left text-xs text-navy">
          Delete <span className="font-medium">{name}</span> permanently?
        </p>
        <div className="mt-2 flex justify-end gap-2">
          <AdminButton
            type="button"
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await removeProductAction({ id });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Product deleted");
                setConfirming(false);
                router.refresh();
              });
            }}
          >
            {pending ? "Deleting..." : "Confirm"}
          </AdminButton>
          <AdminButton type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
            Cancel
          </AdminButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/admin/catalog/products/${id}`}
        className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium text-navy hover:bg-navy/5"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Link>

      {canDelete ? (
        <AdminButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${name}`}
          className="text-red hover:bg-red/5 hover:text-red"
        >
          <Trash2 className="h-4 w-4" />
        </AdminButton>
      ) : null}
    </div>
  );
}
