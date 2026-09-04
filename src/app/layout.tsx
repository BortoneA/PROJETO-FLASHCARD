import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anki Pro - Flashcards & Spaced Repetition",
  description: "App de Flashcards Anki Pro com sincronização em tempo real e visual premium",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Anki Pro",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark h-full antialiased selection:bg-[#0071e3]/40 selection:text-white">
      <body className="min-h-full bg-black text-white flex flex-col font-sans touch-manipulation safe-bottom">
        {children}
      </body>
    </html>
  );
}
