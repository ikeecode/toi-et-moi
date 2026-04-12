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
  themeColor: "#1a1025",
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
      <body className="flex min-h-full flex-col overflow-x-hidden bg-background text-foreground selection:bg-[#ffadf9]/30 selection:text-[#fff6ff]">
        {children}
        <SwRegister />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#21172d",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#ecddfb",
            },
          }}
        />
      </body>
    </html>
  );
}
