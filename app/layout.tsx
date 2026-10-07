import type { Metadata } from "next";
import "./globals.css";
import { COMPANY, OFFER } from "@/lib/config";

export const metadata: Metadata = {
  title: `GBP Management by ${COMPANY.tradingName}`,
  description: `Google Business Profile management for Australian local service businesses. $${OFFER.priceMonthly}/month inc GST, ${OFFER.minimumTermMonths}-month minimum. Sign up online in about 4 minutes.`,
  icons: { icon: "/lsp-logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
