"use client";

import Link from "next/link";
import GlassSurface from "@/components/GlassSurface";

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
    <GlassSurface
      width="100%"
      height="100%"
      borderRadius={0}
      borderWidth={0.05}
      brightness={85}
      opacity={0.85}
      blur={8}
      displace={0}
      backgroundOpacity={0.15}
      saturation={1.2}
      distortionScale={-150}
      redOffset={0}
      greenOffset={8}
      blueOffset={16}
      mixBlendMode="difference"
      className="aspect-square"
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
