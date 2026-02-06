"use client";

import { useEffect, useState } from 'react';
import Flower from './Flower';
import './FlowerGarden.css';

interface FlowerData {
  id: number;
  scale: number;
  position: number;
  variant: 1 | 2 | 3;
  colorTheme: 'cyan' | 'pink';
}

interface FlowerGardenProps {
  totalMinutes: number;
}

const MAX_FLOWERS = 22;
const BASE_SCALE = 0.2;
const MAX_SCALE = 2.0;
const SPAWN_INTERVAL = 5;
const MAX_TIME_MINUTES = 360;
const GROWTH_PER_INTERVAL = (MAX_SCALE - BASE_SCALE) / (MAX_TIME_MINUTES / SPAWN_INTERVAL);

export default function FlowerGarden({ totalMinutes }: FlowerGardenProps) {
  const [flowers, setFlowers] = useState<FlowerData[]>([]);

  useEffect(() => {
    const newFlowers: FlowerData[] = [];
    
    if (totalMinutes < SPAWN_INTERVAL) {
      setFlowers([]);
      return;
    }

    const currentInterval = Math.floor(totalMinutes / SPAWN_INTERVAL);
    const maxIntervals = MAX_TIME_MINUTES / SPAWN_INTERVAL;
    
    const targetFlowerCount = Math.min(
      MAX_FLOWERS,
      Math.max(2, Math.floor(2 + (currentInterval / maxIntervals) * 20))
    );
    
    for (let i = 0; i < targetFlowerCount; i++) {
      let spawnInterval: number;
      if (i < 2) {
        spawnInterval = 1;
      } else {
        const remainingFlowers = i - 1;
        spawnInterval = 2 + Math.floor((remainingFlowers / 20) * 70);
      }
      
      const intervalsSinceSpawn = Math.max(0, currentInterval - spawnInterval);
      let scale = BASE_SCALE + (intervalsSinceSpawn * GROWTH_PER_INTERVAL);
      scale = Math.min(scale, MAX_SCALE);
      
      const position = calculatePosition(i);
      const colorTheme: 'cyan' | 'pink' = i % 2 === 0 ? 'cyan' : 'pink';
      
      newFlowers.push({
        id: i,
        scale,
        position,
        variant: ((i % 3) + 1) as 1 | 2 | 3,
        colorTheme,
      });
    }
    
    setFlowers(newFlowers);
  }, [totalMinutes]);

  const calculatePosition = (index: number): number => {
    const minPosition = 5;
    const maxPosition = 95;
    const spacing = (maxPosition - minPosition) / (MAX_FLOWERS - 1);
    
    return minPosition + (index * spacing);
  };

  if (flowers.length === 0) {
    return null;
  }

  return (
    <div className="flower-garden">
      {flowers.map((flower) => (
        <Flower
          key={flower.id}
          scale={flower.scale}
          variant={flower.variant}
          colorTheme={flower.colorTheme}
          className="flower-garden__flower"
          style={{ left: `${flower.position}%` }}
        />
      ))}
    </div>
  );
}
