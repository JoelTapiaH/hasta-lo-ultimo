import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hasta lo último de la tierra",
  description: "Devocionales diarios de la célula para conquistar el mundo con luz.",
};

export const viewport: Viewport = { themeColor: "#060a1c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
