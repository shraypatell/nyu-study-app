"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import './PillNav.css';

interface PillNavItem {
  label: string;
  value: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

interface PillNavProps {
  items: PillNavItem[];
  activeValue: string;
  onValueChange: (value: string) => void;
  className?: string;
  ease?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
}

export default function PillNav({
  items,
  activeValue,
  onValueChange,
  className = '',
  ease = 'power3.easeOut',
  pillColor = 'rgba(255, 255, 255, 0.3)',
  hoveredPillTextColor = '#000000',
  pillTextColor = '#111111'
}: PillNavProps) {
  const circleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRefs = useRef<gsap.core.Timeline[]>([]);
  const activeTweenRefs = useRef<gsap.core.Tween[]>([]);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle, i) => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        });

        const label = pill.querySelector('.pill-label');
        const white = pill.querySelector('.pill-label-hover');

        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        tlRefs.current[i]?.kill();
        const tl = gsap.timeline({ paused: true });

        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0);

        if (label) {
          tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0);
        }

        if (white) {
          gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(white, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0);
        }

        tlRefs.current[i] = tl;
      });
    };

    layout();

    const onResize = () => layout();
    window.addEventListener('resize', onResize);

    if (document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    return () => window.removeEventListener('resize', onResize);
  }, [items, ease]);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: 'auto'
    });
  };

  const handleClick = (value: string) => {
    onValueChange(value);
  };

const cssVars = {
  ['--pill-bg']: pillColor,
  ['--hover-text']: hoveredPillTextColor || '#000000',
  ['--pill-text']: pillTextColor
} as React.CSSProperties;

  return (
    <div className={`pill-nav-glass ${className}`} ref={navRef} style={cssVars}>
      <div className="pill-nav-items">
        <ul className="pill-list" role="tablist">
          {items.map((item, i) => (
            <li key={item.value} role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={activeValue === item.value}
                aria-controls={`panel-${item.value}`}
                id={`tab-${item.value}`}
                className={`pill ${activeValue === item.value ? 'is-active' : ''}`}
                onMouseEnter={() => handleEnter(i)}
                onMouseLeave={() => handleLeave(i)}
                onClick={() => handleClick(item.value)}
              >
                <span
                  className="hover-circle"
                  aria-hidden="true"
                  ref={el => { circleRefs.current[i] = el; }}
                />
                <span className="label-stack">
                  <span className="pill-label">
                    {item.icon && <span className="pill-icon">{item.icon}</span>}
                    {item.label}
                    {item.badge}
                  </span>
                  <span className="pill-label-hover" aria-hidden="true">
                    {item.icon && <span className="pill-icon">{item.icon}</span>}
                    {item.label}
                    {item.badge}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
