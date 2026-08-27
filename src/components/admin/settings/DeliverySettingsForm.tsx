"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AdminButton, AdminInput, AdminLabel } from "@/components/admin/ui";
import { saveStoreSettingsAction } from "@/server/settings/actions";

const schema = z.object({
  deliveryFeeMajor: z.number().min(0, "Delivery fee cannot be negative"),
  freeDeliveryThresholdMajor: z.number().min(0, "Threshold cannot be negative"),
});

type FormValues = z.infer<typeof schema>;

export function DeliverySettingsForm({
  deliveryFeeMajor,
  freeDeliveryThresholdMajor,
}: FormValues) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { deliveryFeeMajor, freeDeliveryThresholdMajor },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await saveStoreSettingsAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Delivery charges saved.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <AdminLabel htmlFor="delivery-fee">Standard delivery fee (Rs)</AdminLabel>
        <AdminInput
          id="delivery-fee"
          type="number"
          min={0}
          step={1}
          {...form.register("deliveryFeeMajor", { valueAsNumber: true })}
        />
        <p className="mt-1 text-xs text-muted">Charged on orders below the free delivery amount.</p>
        {form.formState.errors.deliveryFeeMajor ? (
          <p className="mt-1 text-xs text-red">{form.formState.errors.deliveryFeeMajor.message}</p>
        ) : null}
      </div>
      <div>
        <AdminLabel htmlFor="free-delivery">Free delivery above (Rs)</AdminLabel>
        <AdminInput
          id="free-delivery"
          type="number"
          min={0}
          step={1}
          {...form.register("freeDeliveryThresholdMajor", { valueAsNumber: true })}
        />
        <p className="mt-1 text-xs text-muted">
          Orders at or above this subtotal get free delivery. Set to 0 to always charge the fee.
        </p>
        {form.formState.errors.freeDeliveryThresholdMajor ? (
          <p className="mt-1 text-xs text-red">
            {form.formState.errors.freeDeliveryThresholdMajor.message}
          </p>
        ) : null}
      </div>
      <AdminButton type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save delivery charges"}
      </AdminButton>
    </form>
  );
}
