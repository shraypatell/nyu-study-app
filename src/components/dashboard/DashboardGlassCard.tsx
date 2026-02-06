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
    >
        <GlassSurface
          width="100%"
          height="100%"
          borderRadius={23}
          borderWidth={0.05}
          brightness={40}
          opacity={0.3}
          blur={8}
          displace={0}
          backgroundOpacity={0.03}
          saturation={0.8}
          distortionScale={-150}
          redOffset={0}
          greenOffset={5}
          blueOffset={10}
          mixBlendMode="difference"
          className="rounded-[23px]"
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
