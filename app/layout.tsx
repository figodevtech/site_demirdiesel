import type { Metadata } from "next";
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Demir Diesel - Oficina e Peças",
  description: "Peças para veículos diesel, acessórios e serviços especializados. Loja Oficial Demir Diesel.",
};

import { CartProvider } from "@/components/providers/CartContext";
import { AuthProvider } from "@/components/providers/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
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
            <CartProvider>
                <Navbar />
                <main className="flex-1 w-full flex flex-col">
                {children}
                </main>
                <Footer />
                <Toaster />
            </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
