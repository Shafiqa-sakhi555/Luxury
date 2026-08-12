import { InfoPageView, infoPageMetadata } from "@/components/pages/InfoPageView";
import { infoPages } from "@/lib/infoPages";

const page = infoPages.returns;

export const metadata = infoPageMetadata(page);

export default function ReturnsPage() {
  return <InfoPageView page={page} />;
}
