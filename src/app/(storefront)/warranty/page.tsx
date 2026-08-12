import { InfoPageView, infoPageMetadata } from "@/components/pages/InfoPageView";
import { infoPages } from "@/lib/infoPages";

const page = infoPages.warranty;

export const metadata = infoPageMetadata(page);

export default function WarrantyPage() {
  return <InfoPageView page={page} />;
}
