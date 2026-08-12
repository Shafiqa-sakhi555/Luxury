import { InfoPageView, infoPageMetadata } from "@/components/pages/InfoPageView";
import { infoPages } from "@/lib/infoPages";

const page = infoPages.terms;

export const metadata = infoPageMetadata(page);

export default function TermsPage() {
  return <InfoPageView page={page} />;
}
