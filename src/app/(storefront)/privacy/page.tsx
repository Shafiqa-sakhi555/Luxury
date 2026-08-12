import { InfoPageView, infoPageMetadata } from "@/components/pages/InfoPageView";
import { infoPages } from "@/lib/infoPages";

const page = infoPages.privacy;

export const metadata = infoPageMetadata(page);

export default function PrivacyPage() {
  return <InfoPageView page={page} />;
}
