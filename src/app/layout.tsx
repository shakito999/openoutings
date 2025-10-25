import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Providers from "@/components/Providers";
import MessageNotificationManager from "@/components/MessageNotificationManager";
import MobileKeyboardInsets from "@/components/MobileKeyboardInsets";
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";
import FooterWrapper from "@/components/FooterWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenOutings - Connect & Organize Group Activities",
  description: "Find friends and organize small group activities. Create events, share availability polls, and discover exciting social opportunities.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Providers>
          <MobileKeyboardInsets />
          <MessageNotificationManager />
          <NotificationPermissionPrompt />
          <Navigation />
          <main className="flex-1">{children}</main>
          <FooterWrapper />
        </Providers>
      </body>
    </html>
  );
}
