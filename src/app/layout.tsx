import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Jalals Home Solution — Premium Furnishings & Surfaces | Pakistan",
  description:
    "Premium home furnishings by Jalals Group. 13 categories — carpets, rugs, furniture, flooring and decor with customization across Pakistan.",
  keywords: [
    "carpets Pakistan",
    "home furniture Pakistan",
    "rugs Gilgit Baltistan",
    "Jalals Home Solution",
    "Jalals Group",
    "prayer mats",
    "flooring Pakistan",
  ],
  openGraph: {
    title: "Jalals Home Solution — Premium Furnishings & Surfaces",
    description:
      "Carpets, rugs, furniture, flooring and decor — 13 categories with custom sizing.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="overflow-x-hidden pattern-carpet">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
