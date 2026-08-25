import { InfoPageView, infoPageMetadata } from "@/components/pages/InfoPageView";
import { infoPages } from "@/lib/infoPages";
import { getStoreSettings } from "@/server/settings/store-settings";
import { formatMoney } from "@/lib/money";

const page = infoPages.delivery;

export const metadata = infoPageMetadata(page);

export default async function DeliveryPage() {
  const settings = await getStoreSettings();
  const fee = formatMoney(settings.deliveryFeeMinor);
  const threshold = formatMoney(settings.freeDeliveryThresholdMinor);
  const freeCopy =
    settings.deliveryFeeMinor === 0
      ? "Delivery is currently free on all orders."
      : settings.freeDeliveryThresholdMinor > 0
        ? `Free delivery is available on orders of ${threshold} and above. Orders below that amount are charged ${fee} at checkout.`
        : `Standard delivery is ${fee} at checkout.`;

  return (
    <InfoPageView
      page={{
        ...page,
        sections: page.sections.map((section) =>
          section.heading === "Free delivery" ? { ...section, body: freeCopy } : section
        ),
      }}
    />
  );
}
