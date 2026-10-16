import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./tokens.css";
import "./shell.css";

export const metadata: Metadata = {
  title: "Hazine Ajanı",
  description: "OKX Dual Investment işlem öncesi risk kapısı",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
