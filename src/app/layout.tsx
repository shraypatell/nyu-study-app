import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import StaggeredMenu from "@/components/layout/StaggeredMenu";
import TargetCursor from "@/components/layout/TargetCursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NYU Study App",
  description: "Track your study time, compete on leaderboards, and connect with classmates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexSans.variable} antialiased min-h-screen`}
      >
        <div className="min-h-screen">
          <StaggeredMenu />
          <TargetCursor />
          <main className="page-transition">{children}</main>
        </div>
      </body>
    </html>
  );
}
