"use client";

import { useEffect, useState, useMemo } from 'react';
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

const MAX_FLOWERS = 10;
const BASE_SCALE = 0.2;
const GROWTH_INCREMENT = 0.1;
const SPAWN_INTERVAL = 5;

export default function FlowerGarden({ totalMinutes }: FlowerGardenProps) {
  const [flowers, setFlowers] = useState<FlowerData[]>([]);

  useEffect(() => {
    const newFlowers: FlowerData[] = [];
    
    if (totalMinutes < SPAWN_INTERVAL) {
      setFlowers([]);
      return;
    }

    let currentBatch = 0;
    let minutesRemaining = totalMinutes;
    
    while (minutesRemaining >= SPAWN_INTERVAL && newFlowers.length < MAX_FLOWERS) {
      currentBatch++;
      
      const batchStartIndex = (currentBatch - 1) * 2;
      const flowersInThisBatch = Math.min(2, MAX_FLOWERS - batchStartIndex);
      
      for (let i = 0; i < flowersInThisBatch; i++) {
        const flowerIndex = batchStartIndex + i;
        if (flowerIndex >= MAX_FLOWERS) break;
        
        let scale = BASE_SCALE;
        
        const batchesAfterSpawn = Math.floor((totalMinutes - (currentBatch * SPAWN_INTERVAL)) / SPAWN_INTERVAL) + 1;
        
        for (let b = 0; b < batchesAfterSpawn && b < 8; b++) {
          scale += GROWTH_INCREMENT;
        }
        
        scale = Math.min(scale, 1.0);
        
        const position = calculatePosition(flowerIndex, MAX_FLOWERS);
        
        const colorTheme: 'cyan' | 'pink' = flowerIndex < MAX_FLOWERS / 2 ? 'cyan' : 'pink';
        
        newFlowers.push({
          id: flowerIndex,
          scale,
          position,
          variant: ((flowerIndex % 3) + 1) as 1 | 2 | 3,
          colorTheme,
        });
      }
      
      minutesRemaining -= SPAWN_INTERVAL;
    }
    
    setFlowers(newFlowers);
  }, [totalMinutes]);

  const calculatePosition = (index: number, total: number): number => {
    if (total <= 2) {
      return index === 0 ? 10 : 90;
    }
    
    const spacing = 80 / (total - 1);
    return 10 + (index * spacing);
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
