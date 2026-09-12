import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Background from "@/components/background"; 
import { AuthProvider } from "@/lib/AuthContext"; // <-- 1. Import your AuthProvider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CITEMAS Portal",
  description: "College of Technology Education Multimedia Arts System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-transparent text-ink relative overflow-x-hidden`}
      >
        <AuthProvider>
          <Background />

          <div className="relative z-10">
            <Navbar />
          </div>

          <main className="relative z-10 flex-grow">{children}</main>

          <div className="relative z-10">
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}