"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminButton } from "@/components/admin/ui";

export function RepairProductImagesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRepair() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/catalog/repair-images", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Repair failed.");
      }
      toast.success(`Linked images for ${data.repaired} product(s).`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Repair failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminButton type="button" variant="outline" disabled={loading} onClick={handleRepair}>
      {loading ? "Syncing images..." : "Sync images from Cloudinary"}
    </AdminButton>
  );
}
