"use client";

import { useState } from "react";
import { saveShippingSettingsAction } from "@/server/shipping/actions";
import { toMajor } from "@/lib/money";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { Input } from "@/components/ui/input";

export function ShippingSettingsForm({ initialRates }: { initialRates: any }) {
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState(toMajor(initialRates.freeDeliveryThresholdMinor).toString());
  
  const [courierBands, setCourierBands] = useState(
    initialRates.weightBands
      .filter((b: any) => b.shippingType === "COURIER")
      .map((b: any) => ({ ...b, rateMajor: toMajor(b.rateMinor).toString() }))
  );
  
  const [cargoBands, setCargoBands] = useState(
    initialRates.weightBands
      .filter((b: any) => b.shippingType === "CARGO")
      .map((b: any) => ({ ...b, rateMajor: toMajor(b.rateMinor).toString() }))
  );
  
  const [furnitureRates, setFurnitureRates] = useState(
    initialRates.furnitureRates.map((r: any) => ({ ...r, rateMajor: toMajor(r.rateMinor).toString() }))
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      freeDeliveryThresholdMajor: Number(threshold),
      courierBands: courierBands.map((b: any) => ({
        shippingType: "COURIER",
        maxWeightKg: b.maxWeightKg,
        rateMajor: Number(b.rateMajor),
      })),
      cargoBands: cargoBands.map((b: any) => ({
        shippingType: "CARGO",
        maxWeightKg: b.maxWeightKg,
        rateMajor: Number(b.rateMajor),
      })),
      furnitureRates: furnitureRates.map((r: any) => ({
        kind: r.kind,
        label: r.label,
        rateMajor: Number(r.rateMajor),
      })),
    };
    
    const result = await saveShippingSettingsAction(payload as any);
    
    setLoading(false);
    if (result.ok) {
      toast.success("Shipping rates updated successfully");
    } else {
      toast.error(result.error ?? "Failed to save settings");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AdminCard className="p-6">
        <h2 className="text-lg font-semibold mb-4">Free Delivery Threshold</h2>
        <div>
          <label className="text-sm block mb-1">Subtotal (Rs)</label>
          <Input 
            type="number" 
            value={threshold} 
            onChange={(e) => setThreshold(e.target.value)} 
            className="max-w-xs"
            required
          />
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <h2 className="text-lg font-semibold mb-4">Courier Rates (Small Items)</h2>
        <div className="space-y-3">
          {courierBands.map((band: any, i: number) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-32">
                <span className="text-sm">Up to {band.maxWeightKg ? `${band.maxWeightKg}kg` : 'any'}</span>
              </div>
              <Input 
                type="number" 
                value={band.rateMajor} 
                onChange={(e) => {
                  const newBands = [...courierBands];
                  newBands[i].rateMajor = e.target.value;
                  setCourierBands(newBands);
                }} 
                className="w-32"
                required
              />
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <h2 className="text-lg font-semibold mb-4">Cargo Rates (Large Items)</h2>
        <div className="space-y-3">
          {cargoBands.map((band: any, i: number) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-32">
                <span className="text-sm">Up to {band.maxWeightKg ? `${band.maxWeightKg}kg` : 'any'}</span>
              </div>
              <Input 
                type="number" 
                value={band.rateMajor} 
                onChange={(e) => {
                  const newBands = [...cargoBands];
                  newBands[i].rateMajor = e.target.value;
                  setCargoBands(newBands);
                }} 
                className="w-32"
                required
              />
            </div>
          ))}
        </div>
      </AdminCard>
      
      <AdminCard className="p-6">
        <h2 className="text-lg font-semibold mb-4">Furniture Delivery Rates</h2>
        <div className="space-y-3">
          {furnitureRates.map((rate: any, i: number) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-32">
                <span className="text-sm">{rate.label}</span>
              </div>
              <Input 
                type="number" 
                value={rate.rateMajor} 
                onChange={(e) => {
                  const newRates = [...furnitureRates];
                  newRates[i].rateMajor = e.target.value;
                  setFurnitureRates(newRates);
                }} 
                className="w-32"
                required
              />
            </div>
          ))}
        </div>
      </AdminCard>

      <button
        type="submit"
        disabled={loading}
        className="bg-navy text-white px-6 py-2 rounded font-medium hover:bg-navy/90 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
