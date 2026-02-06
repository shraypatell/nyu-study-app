"use client";

import './GlassSurface.css';

interface GlassSurfaceProps {
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
  style?: React.CSSProperties;
}

const GlassSurface = ({
  children,
  width = 200,
  height = 80,
  borderRadius = 23,
  className = '',
  style = {}
}: GlassSurfaceProps) => {
  const containerStyle: React.CSSProperties = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
  };

  return (
    <div
      className={`glass-surface ${className}`}
      style={containerStyle}
    >
      <div className="glass-surface__content">{children}</div>
    </div>
  );
};

export default GlassSurface;
