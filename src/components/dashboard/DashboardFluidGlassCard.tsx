"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import FluidGlass from "@/components/FluidGlass";

interface DashboardFluidGlassCardProps {
  title: string;
  children: React.ReactNode;
  href?: string;
  isClickable?: boolean;
  className?: string;
}

export default function DashboardFluidGlassCard({
  title,
  children,
  href,
  isClickable = true,
  className,
}: DashboardFluidGlassCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const content = (
    <div
      ref={containerRef}
      className={cn(
        "aspect-square relative overflow-hidden",
        isClickable ? "cursor-pointer" : "",
        className
      )}
    >
      <div className="absolute inset-0 z-0">
        <FluidGlass
          scale={0.15}
          ior={1.15}
          thickness={10}
          transmission={1}
          roughness={0}
          chromaticAberration={0.1}
          anisotropy={0.01}
          color="#ffffff"
          attenuationColor="#ffffff"
          attenuationDistance={0.25}
        />
      </div>

      <div className="relative z-10 h-full flex flex-col p-5 text-black">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] mb-3">
          {title}
        </h3>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );

  if (isClickable && href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
