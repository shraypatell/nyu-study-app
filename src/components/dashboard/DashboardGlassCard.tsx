"use client";

import Link from "next/link";
import GlassSurface from "@/components/GlassSurface";
import TiltedCard from "@/components/TiltedCard";

interface DashboardGlassCardProps {
  title: string;
  children: React.ReactNode;
  href?: string;
}

export default function DashboardGlassCard({
  title,
  children,
  href,
}: DashboardGlassCardProps) {
  const content = (
    <TiltedCard 
      rotateAmplitude={22}
      scaleOnHover={1.05}
      className="aspect-square"
      style={{ borderRadius: '23px', overflow: 'hidden' }}
    >
      <GlassSurface
        width="100%"
        height="100%"
        borderRadius={23}
        borderWidth={0.05}
        brightness={70}
        opacity={0.5}
        blur={8}
        displace={0}
        backgroundOpacity={0.05}
        saturation={1}
        distortionScale={-150}
        redOffset={0}
        greenOffset={5}
        blueOffset={10}
        mixBlendMode="difference"
      >
        <div className="w-full h-full flex flex-col p-5 text-black overflow-hidden">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] mb-3 shrink-0">
            {title}
          </h3>
          <div className="flex-1 overflow-hidden min-h-0">
            {children}
          </div>
        </div>
      </GlassSurface>
    </TiltedCard>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
