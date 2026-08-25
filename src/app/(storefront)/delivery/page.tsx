import { InfoPageView, infoPageMetadata } from "@/components/pages/InfoPageView";
import { infoPages } from "@/lib/infoPages";

const page = infoPages.delivery;

export const metadata = infoPageMetadata(page);

export default function DeliveryPage() {
  return <InfoPageView page={page} />;
}
