import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: process.env.DASHBOARD_TITLE || "KPI Dashboard",
  description: "Live business metrics in one view",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
