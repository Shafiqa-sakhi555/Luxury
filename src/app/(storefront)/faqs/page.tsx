import { InfoPageView, infoPageMetadata } from "@/components/pages/InfoPageView";
import { infoPages } from "@/lib/infoPages";

const page = infoPages.faqs;

export const metadata = infoPageMetadata(page);

export default function FaqsPage() {
  return <InfoPageView page={page} />;
}
