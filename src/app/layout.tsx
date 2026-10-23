import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ocean Empire 3D",
    template: "%s · Ocean Empire 3D",
  },
  description: "A browser maritime game: sail a 3D ocean, build a trading empire, and explore documented maritime history.",
  applicationName: "Ocean Empire 3D",
};

export const viewport: Viewport = {
  themeColor: "#040b16",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
