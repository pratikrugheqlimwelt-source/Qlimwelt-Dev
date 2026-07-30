import type { Metadata } from "next";
import "./globals.css";
import { jakarta, playfair, jetbrains } from "@/lib/fonts";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Qlimwelt | AI-Powered Carbon Intelligence Platform",
  description:
    "Measure your impact. Shape a better future. Enterprise carbon intelligence for emissions tracking, AI analysis, and sustainability reporting.",
  icons: {
    icon: "/logo-mark.png",
    apple: "/logo-mark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${playfair.variable} ${jetbrains.variable} font-sans antialiased`}>
        <ThemeProvider defaultTheme="light" storageKey="qlimwelt-theme">
          <LocaleProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
            <Toaster />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
