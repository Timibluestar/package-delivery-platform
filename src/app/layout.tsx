import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ParcelFlow | Global Logistics",
  description:
    "Ship, track and manage packages with a modern global delivery platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
