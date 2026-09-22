import { NextResponse } from "next/server";
import { getShippingRates } from "@/server/shipping/settings";
import { SHIPPING_TYPE_LABELS } from "@/lib/shipping/defaults";

export async function GET() {
  const rates = await getShippingRates();
  return NextResponse.json({
    freeDeliveryThresholdMinor: rates.freeDeliveryThresholdMinor,
    types: SHIPPING_TYPE_LABELS,
    weightBands: rates.weightBands,
    furnitureRates: rates.furnitureRates,
  });
}
