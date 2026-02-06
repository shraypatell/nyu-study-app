import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import StaggeredMenu from "@/components/layout/StaggeredMenu";
import Grainient from "@/components/Grainient";

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
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Grainient
            color1="#d6d6d6"
            color2="#d9cafe"
            color3="#ffffff"
            timeSpeed={0.25}
            colorBalance={-0.07}
            warpStrength={4}
            warpFrequency={5}
            warpSpeed={0.3}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={0}
            rotationAmount={0}
            noiseScale={0}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={0.8}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
        </div>
        <div className="relative z-10 min-h-screen">
          <StaggeredMenu />
          <main className="page-transition">{children}</main>
        </div>
      </body>
    </html>
  );
}
