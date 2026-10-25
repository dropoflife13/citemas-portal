import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ConditionalFooter from "@/components/ConditionalFooter";
import Background from "@/components/background"; 
import { AuthProvider } from "@/lib/AuthContext"; // <-- 1. Import your AuthProvider
import { ToastProvider } from "@/components/Toast";
import ScrollSpine from "@/components/ScrollSpine";

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('citemas-theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else{document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-transparent text-ink relative overflow-x-clip`}
      >
        <AuthProvider>
          <ToastProvider>
            <Background />

            {/* Global Fixed Header (Outside Page Wrappers) */}
            <Navbar />

            {/* Global Scroll Progress Spine */}
            <ScrollSpine />

            {/* Main Content (pt-20 offsets the fixed navbar) */}
            <main className="relative z-10 flex-1 flex flex-col pt-20">{children}</main>

            <ConditionalFooter />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}