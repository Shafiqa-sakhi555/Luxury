"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateHandoffStatusAction } from "@/server/assistant/handoff-actions";
import { HANDOFF_STATUS_OPTIONS } from "@/lib/admin/status-badges";
import { AdminSelect, AdminButton } from "@/components/admin/ui";

export function HandoffStatusForm({
  handoffId,
  currentStatus,
}: {
  handoffId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await updateHandoffStatusAction({ handoffId, status });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      <div>
        <label className="sr-only" htmlFor={`handoff-status-${handoffId}`}>
          Handoff status
        </label>
        <AdminSelect
          id={`handoff-status-${handoffId}`}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="min-w-[9rem]"
        >
          {HANDOFF_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option.replace(/_/g, " ")}
            </option>
          ))}
        </AdminSelect>
      </div>
      <AdminButton type="submit" size="sm" disabled={pending || status === currentStatus}>
        {pending ? "Saving…" : "Update"}
      </AdminButton>
      {error ? <p className="w-full text-xs text-red">{error}</p> : null}
    </form>
  );
}
