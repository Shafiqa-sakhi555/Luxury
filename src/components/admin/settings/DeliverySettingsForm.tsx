"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AdminButton, AdminInput, AdminLabel } from "@/components/admin/ui";
import { updateDeliverySettingsAction } from "@/server/settings/actions";
import { toMajor } from "@/lib/money";

export function DeliverySettingsForm({
  deliveryFeeMinor,
  freeDeliveryThresholdMinor,
}: {
  deliveryFeeMinor: number;
  freeDeliveryThresholdMinor: number;
}) {
  const [pending, startTransition] = useTransition();
  const [deliveryFee, setDeliveryFee] = useState(String(Math.round(toMajor(deliveryFeeMinor))));
  const [threshold, setThreshold] = useState(
    String(Math.round(toMajor(freeDeliveryThresholdMinor)))
  );

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateDeliverySettingsAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Delivery charges saved. Cart and checkout will use the new amounts.");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <AdminLabel htmlFor="deliveryFee">Standard delivery fee (PKR)</AdminLabel>
        <AdminInput
          id="deliveryFee"
          name="deliveryFee"
          type="number"
          min={0}
          step={1}
          required
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted">Charged at checkout when the order is below the free threshold.</p>
      </div>
      <div>
        <AdminLabel htmlFor="freeDeliveryThreshold">Free delivery above (PKR)</AdminLabel>
        <AdminInput
          id="freeDeliveryThreshold"
          name="freeDeliveryThreshold"
          type="number"
          min={0}
          step={1}
          required
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted">
          Set to 0 to always charge the delivery fee. Set the fee to 0 for free delivery on all orders.
        </p>
      </div>
      <AdminButton type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save delivery charges"}
      </AdminButton>
    </form>
  );
}
