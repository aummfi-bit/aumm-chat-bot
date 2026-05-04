import type { Metadata } from "next";
import { Inter, VT323 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeClassSync } from "@/components/theme-class-sync";
import { ThemeProvider } from "@/components/theme-provider";

const vt323 = VT323({
  weight: "400",
  variable: "--font-vt323",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Aureum chat",
  description:
    "Assistant grounded in the canonical Aureum skill corpus (aumm-skill). Official protocol docs at https://aumm.fi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${vt323.variable} ${inter.variable} antialiased font-sans`}
      >
        <ThemeProvider>
          <ThemeClassSync />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
