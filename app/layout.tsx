import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { inter } from "@/lib/fonts";
import { APP } from "@/lib/constants";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import FloatingSupportChatWidget from "@/components/support-chat/FloatingSupportChatWidget";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: APP.name,
  description:
    "Enfield Nexus provides fast and reliable Japanese vehicle history reports and auction details for vehicle buyers and importers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", geist.variable)}
    >
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <FloatingSupportChatWidget />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
