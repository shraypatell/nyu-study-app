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
    <html lang="en" className="bg-[#a8c6fe]">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexSans.variable} antialiased min-h-screen bg-[#a8c6fe]`}
      >
        <div 
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            willChange: 'transform',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            contain: 'strict'
          }}
        >
          <Grainient
            color1="#a8c6fe"
            color2="#74a7fe"
            color3="#a8c6fe"
            timeSpeed={1}
            colorBalance={-0.14}
            warpStrength={1}
            warpFrequency={5}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={0.05}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
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
