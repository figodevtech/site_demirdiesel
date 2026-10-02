import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import Navbar from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/AuthContext";
import { RouteShell } from "@/components/layout/RouteShell";
import { Analytics } from "@vercel/analytics/next";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { siteConfig } from "@/lib/site-config";
import { PWA_THEME_COLOR } from "@/lib/pwa/config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // Necessário para env(safe-area-inset-*) funcionar (notch, home indicator, barra de gestos).
  viewportFit: "cover",
  colorScheme: "light",
};

export const metadata: Metadata = {
  applicationName: "Demir Diesel",
  title: {
    default: "Demir Diesel - Peças, Módulos Eletrônicos & Oficina Especializada",
    template: "%s | Demir Diesel",
  },
  description:
    "Especialistas em motores diesel, injeção eletrônica, módulos ECM/cabine e componentes para caminhões e linha pesada. Catálogo completo e despacho para todo o Brasil.",
  keywords: [
    "peças diesel",
    "módulo diesel",
    "injeção eletrônica caminhão",
    "bomba injetora",
    "oficina diesel joão pessoa",
    "demir diesel",
    "turbina diesel",
    "common rail",
  ],
  authors: [{ name: "Demir Diesel" }],
  appleWebApp: {
    capable: true,
    title: "Demir Diesel",
    // "default" mantém a barra de status opaca sobre o header branco (sem conteúdo por baixo).
    statusBarStyle: "default",
  },
  // Evita que o Safari transforme referências numéricas de peças em links de telefone.
  formatDetection: {
    telephone: false,
  },
  creator: "Demir Diesel",
  metadataBase: new URL(siteConfig.url),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteConfig.url,
    siteName: "Demir Diesel",
    title: "Demir Diesel - Peças, Módulos Eletrônicos & Oficina Especializada",
    description:
      "Catálogo de peças pesadas, componentes de injeção e módulos eletrônicos diesel para caminhões e frotas. Envio para todo o Brasil.",
    images: [
      {
        url: "/images/og-presentation.png",
        width: 1200,
        height: 630,
        alt: "Demir Diesel - Peças, Módulos Eletrônicos & Oficina Especializada",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Demir Diesel - Peças, Módulos Eletrônicos & Oficina Especializada",
    description:
      "Catálogo de peças pesadas, componentes de injeção e módulos eletrônicos diesel para caminhões e frotas. Envio para todo o Brasil.",
    images: ["/images/og-presentation.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable} scroll-smooth`}>
      <body className="flex flex-col min-h-screen antialiased bg-background font-sans text-foreground">
        <NextTopLoader
          color="#0A7AAC"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #0A7AAC,0 0 5px #0A7AAC"
        />
        <AuthProvider>
          <RouteShell
            navbar={<Navbar />}
            footer={<Footer />}
            bottomNav={<BottomNav />}
          >
            {children}
          </RouteShell>
          <PwaProvider />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
