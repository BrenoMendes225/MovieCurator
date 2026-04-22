import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import Navigation from "@/components/Navigation/Navigation";
import Header from "@/components/Header/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MoviFlow",
  description: "Seu lugar na primeira fila do cinema.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.variable}>
        <UserProvider>
          <Header />
          <main style={{ paddingTop: '70px', paddingBottom: '85px', minHeight: '100vh' }}>
            {children}
          </main>
          <Navigation />
        </UserProvider>
      </body>
    </html>
  );
}
