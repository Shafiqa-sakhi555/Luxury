import type { Metadata } from "next";
import { ContactPageContent } from "./ContactPageContent";

export const metadata: Metadata = {
  title: "Contact & Branches — Jalals Home Solution",
  description:
    "Visit Jalal's Home Solution and Pak Turk Carpets showrooms across Gilgit-Baltistan. Flagship in Jutial Gilgit, plus Hunza, Skardu, and Gakuch.",
};

export default function ContactPage() {
  return <ContactPageContent />;
}
