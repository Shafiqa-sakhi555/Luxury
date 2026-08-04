import type { Metadata } from "next";
import { AboutPageContent } from "./AboutPageContent";

export const metadata: Metadata = {
  title: "About Us — Jalals Home Solution",
  description:
    "Learn about Jalal Uddin's journey and Jalals Home Solution — premium home furnishings across Gilgit-Baltistan and Pakistan.",
};

export default function AboutPage() {
  return <AboutPageContent />;
}
