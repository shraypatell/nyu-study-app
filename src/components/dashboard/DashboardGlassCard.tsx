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
      rotateAmplitude={13}
      scaleOnHover={1.15}
      className="aspect-square"
    >
      <GlassSurface
        width="100%"
        height="100%"
        borderRadius={23}
        borderWidth={0.08}
        brightness={92}
        opacity={0.75}
        blur={6}
        displace={0.3}
        backgroundOpacity={0.08}
        saturation={1.3}
        distortionScale={-120}
        redOffset={2}
        greenOffset={10}
        blueOffset={18}
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
