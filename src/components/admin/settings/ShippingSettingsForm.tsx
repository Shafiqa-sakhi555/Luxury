"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminButton, AdminInput, AdminLabel } from "@/components/admin/ui";
import { saveShippingSettingsAction } from "@/server/shipping/actions";
import { FURNITURE_KIND_LABELS } from "@/lib/shipping/defaults";
import type { FurnitureKind, ShippingRatesConfig } from "@/lib/shipping/types";
import { toMajor } from "@/lib/money";
import { useState } from "react";

type BandRow = { maxWeightKg: number | null; rateMajor: number };

function bandsFromConfig(config: ShippingRatesConfig, type: "COURIER" | "CARGO"): BandRow[] {
  return config.weightBands
    .filter((band) => band.shippingType === type)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((band) => ({
      maxWeightKg: band.maxWeightKg,
      rateMajor: toMajor(band.rateMinor),
    }));
}

export function ShippingSettingsForm({ rates }: { rates: ShippingRatesConfig }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [threshold, setThreshold] = useState(toMajor(rates.freeDeliveryThresholdMinor));
  const [courierBands, setCourierBands] = useState(bandsFromConfig(rates, "COURIER"));
  const [cargoBands, setCargoBands] = useState(bandsFromConfig(rates, "CARGO"));
  const [furnitureRates, setFurnitureRates] = useState(
    rates.furnitureRates.map((rate) => ({
      kind: rate.kind,
      label: rate.label,
      rateMajor: toMajor(rate.rateMinor),
    }))
  );

  function updateBand(
    setter: typeof setCourierBands,
    index: number,
    patch: Partial<BandRow>
  ) {
    setter((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveShippingSettingsAction({
        freeDeliveryThresholdMajor: threshold,
        courierBands: courierBands.map((band) => ({
          shippingType: "COURIER" as const,
          maxWeightKg: band.maxWeightKg,
          rateMajor: band.rateMajor,
        })),
        cargoBands: cargoBands.map((band) => ({
          shippingType: "CARGO" as const,
          maxWeightKg: band.maxWeightKg,
          rateMajor: band.rateMajor,
        })),
        furnitureRates,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Shipping rates saved.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-semibold text-navy">Free delivery</h2>
        <div className="max-w-xs">
          <AdminLabel htmlFor="free-threshold">Free delivery above (Rs)</AdminLabel>
          <AdminInput
            id="free-threshold"
            type="number"
            min={0}
            step={1}
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value) || 0)}
          />
          <p className="mt-1 text-xs text-muted">
            If the cart subtotal is at or above this amount, all shipping is free. Set 0 to always
            charge shipping.
          </p>
        </div>
      </section>

      <WeightBandEditor
        title="Courier rates"
        description="Small items (towels, prayer mats, pillows, curtains, blankets). Weights in a cart are combined into one courier shipment."
        rows={courierBands}
        onChange={setCourierBands}
        updateBand={(index, patch) => updateBand(setCourierBands, index, patch)}
      />

      <WeightBandEditor
        title="Cargo rates"
        description="Rugs, carpets, and mirrors. Combined cargo weight becomes one cargo shipment."
        rows={cargoBands}
        onChange={setCargoBands}
        updateBand={(index, patch) => updateBand(setCargoBands, index, patch)}
      />

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-navy">Furniture rates</h2>
          <p className="text-sm text-muted">
            One furniture delivery charge per order, using the highest furniture type in the cart.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-navy/10">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2">Rate (Rs)</th>
              </tr>
            </thead>
            <tbody>
              {furnitureRates.map((row, index) => (
                <tr key={row.kind} className="border-t border-navy/10">
                  <td className="px-3 py-2 text-navy">
                    {FURNITURE_KIND_LABELS[row.kind as FurnitureKind]}
                  </td>
                  <td className="px-3 py-2">
                    <AdminInput
                      value={row.label}
                      onChange={(event) =>
                        setFurnitureRates((rows) =>
                          rows.map((item, i) =>
                            i === index ? { ...item, label: event.target.value } : item
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <AdminInput
                      type="number"
                      min={0}
                      step={1}
                      value={row.rateMajor}
                      onChange={(event) =>
                        setFurnitureRates((rows) =>
                          rows.map((item, i) =>
                            i === index
                              ? { ...item, rateMajor: Number(event.target.value) || 0 }
                              : item
                          )
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdminButton type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save shipping settings"}
      </AdminButton>
    </form>
  );
}

function WeightBandEditor({
  title,
  description,
  rows,
  onChange,
  updateBand,
}: {
  title: string;
  description: string;
  rows: BandRow[];
  onChange: (rows: BandRow[]) => void;
  updateBand: (index: number, patch: Partial<BandRow>) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-semibold text-navy">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-navy/10">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">Up to (kg)</th>
              <th className="px-3 py-2">Rate (Rs)</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-navy/10">
                <td className="px-3 py-2">
                  <AdminInput
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder={index === rows.length - 1 ? "Open (no max)" : "e.g. 5"}
                    value={row.maxWeightKg ?? ""}
                    onChange={(event) =>
                      updateBand(index, {
                        maxWeightKg: event.target.value === "" ? null : Number(event.target.value),
                      })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <AdminInput
                    type="number"
                    min={0}
                    step={1}
                    value={row.rateMajor}
                    onChange={(event) =>
                      updateBand(index, { rateMajor: Number(event.target.value) || 0 })
                    }
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  {rows.length > 1 ? (
                    <button
                      type="button"
                      className="text-xs text-red hover:underline"
                      onClick={() => onChange(rows.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="text-sm font-medium text-red hover:underline"
        onClick={() => onChange([...rows, { maxWeightKg: null, rateMajor: 0 }])}
      >
        Add weight band
      </button>
    </section>
  );
}
