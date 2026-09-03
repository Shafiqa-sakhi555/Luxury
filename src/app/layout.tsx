import type { Metadata } from "next";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jalal's Home Solution",
  description: "Premium carpets, rugs, furniture, flooring and home décor across Pakistan.",
  icons: {
    icon: [
      { url: "/brand/jalals-logo.png", type: "image/png" },
    ],
    shortcut: "/brand/jalals-logo.png",
    apple: [
      { url: "/brand/jalals-logo.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="overflow-x-hidden antialiased">
        <SessionProvider>{children}</SessionProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
