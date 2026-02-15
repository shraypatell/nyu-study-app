"use client";

import { useMemo } from 'react';
import './Flower.css';

interface FlowerProps {
  scale?: number;
  variant?: 1 | 2 | 3;
  colorTheme?: 'cyan' | 'pink';
  className?: string;
  style?: React.CSSProperties;
}

export default function Flower({ 
  scale = 1, 
  variant = 1, 
  colorTheme = 'cyan',
  className = '', 
  style: externalStyle 
}: FlowerProps) {
  const style = useMemo(() => ({
    transform: `scale(${scale})`,
    opacity: scale > 0.1 ? 1 : 0,
    ...externalStyle,
  }), [scale, externalStyle]);

  return (
    <div className={`flower-wrapper ${className}`} style={style}>
      <div className={`flower flower--${variant} flower--theme-${colorTheme}`}>
        <div className="flower__leafs">
          <div className="flower__leaf flower__leaf--1"></div>
          <div className="flower__leaf flower__leaf--2"></div>
          <div className="flower__leaf flower__leaf--3"></div>
          <div className="flower__leaf flower__leaf--4"></div>
          <div className="flower__white-circle"></div>
        </div>
        <div className="flower__line">
          <div className="flower__line__leaf flower__line__leaf--1"></div>
          <div className="flower__line__leaf flower__line__leaf--2"></div>
          <div className="flower__line__leaf flower__line__leaf--3"></div>
          <div className="flower__line__leaf flower__line__leaf--4"></div>
          <div className="flower__line__leaf flower__line__leaf--5"></div>
          <div className="flower__line__leaf flower__line__leaf--6"></div>
        </div>
      </div>
    </div>
  );
}
