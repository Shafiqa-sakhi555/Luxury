import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { Navbar } from "@/components/layout/Navbar";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lexury — Carpets, Sofas & Home Furnishings | Gilgit Baltistan",
  description:
    "Premium carpets, sofa sets, curtains, and home furnishings in Gilgit Baltistan, Pakistan. Handmade quality, mountain-inspired designs, delivery across GB.",
  keywords: [
    "carpets Gilgit Baltistan",
    "sofa sets Pakistan",
    "home furniture GB",
    "handmade carpets Hunza",
    "Lexury furniture",
  ],
  openGraph: {
    title: "Lexury — Premium Home Furnishings in Gilgit Baltistan",
    description:
      "Carpets, sofas, curtains & more — crafted for homes in Gilgit Baltistan.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="overflow-x-hidden pattern-carpet">
        <SmoothScrollProvider>
          <LoadingScreen />
          <Navbar />
          <main>{children}</main>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
