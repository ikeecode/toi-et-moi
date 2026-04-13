import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SwRegister } from "@/components/custom/sw-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Toi et Moi",
  description: "Un espace numérique privé pour les couples, pour se connecter, suivre leur parcours et conserver leurs souvenirs partagés.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0b0d12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-x-hidden antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-background text-foreground">
        {children}
        <SwRegister />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "rgba(23, 28, 37, 0.96)",
              border: "1px solid rgba(245, 247, 251, 0.12)",
              color: "#f5f7fb",
              boxShadow: "0 18px 48px rgba(0, 0, 0, 0.32)",
            },
          }}
        />
      </body>
    </html>
  );
}
