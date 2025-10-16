import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { GlobalShell } from '@/components/layout/global-shell'
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import "../styles/calendar.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM Casona María",
  description: "Sistema de gestión de eventos para Casona María",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          {/* GlobalShell provides the sidebar and layout for the whole app */}
          {/* Import lazily to avoid circular deps in server components */}
          {/* We render client-side GlobalShell which uses useSession */}
            {/* GlobalShell provides the sidebar and layout for the whole app (client-side) */}
            <GlobalShell>
              {children}
            </GlobalShell>
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}