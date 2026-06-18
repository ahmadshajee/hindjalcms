import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hindjal CMS portal",
  description: "Product management portal for Hind Jal.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
