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
  maxScale: number;
  growthRate: number;
  spawnDelay: number;
}

interface FlowerGardenProps {
  totalMinutes: number;
}

const MAX_FLOWERS = 22;
const BASE_SCALE = 0.2;
const SPAWN_INTERVAL = 5;
const MAX_TIME_MINUTES = 360;

const MIN_MAX_SCALE = 0.4;
const MAX_MAX_SCALE = 1.0;
const MIN_GROWTH_RATE = 0.015;
const MAX_GROWTH_RATE = 0.035;

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

const generateShuffledPositions = (): number[] => {
  const positions: number[] = [];
  const startPercent = 5;
  const endPercent = 95;
  const spacing = (endPercent - startPercent) / (MAX_FLOWERS - 1);
  
  for (let i = 0; i < MAX_FLOWERS; i++) {
    const variance = (seededRandom(i * 7.3) - 0.5) * 12;
    let pos = startPercent + (i * spacing) + variance;
    pos = Math.max(2, Math.min(98, pos));
    positions.push(pos);
  }
  
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(i * 11.7) * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  return positions;
};

const POSITIONS = generateShuffledPositions();

const generateFlowerData = (index: number): { 
  maxScale: number; 
  growthRate: number; 
  spawnDelay: number;
  position: number;
  variant: 1 | 2 | 3;
  colorTheme: 'cyan' | 'pink';
} => {
  const rand1 = seededRandom(index * 1.1);
  const rand2 = seededRandom(index * 2.3);
  const rand3 = seededRandom(index * 3.7);
  const rand4 = seededRandom(index * 4.9);
  const rand5 = seededRandom(index * 5.2);
  
  const maxScale = MIN_MAX_SCALE + rand1 * (MAX_MAX_SCALE - MIN_MAX_SCALE);
  const growthRate = MIN_GROWTH_RATE + rand2 * (MAX_GROWTH_RATE - MIN_GROWTH_RATE);
  const spawnDelay = Math.floor(rand3 * 60);
  const variant = (Math.floor(rand4 * 3) + 1) as 1 | 2 | 3;
  const colorTheme: 'cyan' | 'pink' = rand5 > 0.5 ? 'cyan' : 'pink';
  const position = POSITIONS[index];
  
  return { maxScale, growthRate, spawnDelay, position, variant, colorTheme };
};

export default function FlowerGarden({ totalMinutes }: FlowerGardenProps) {
  const [flowers, setFlowers] = useState<FlowerData[]>([]);

  useEffect(() => {
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
    
    const newFlowers: FlowerData[] = [];
    
    for (let i = 0; i < targetFlowerCount; i++) {
      const data = generateFlowerData(i);
      const spawnInterval = 1 + Math.floor(data.spawnDelay / SPAWN_INTERVAL);
      
      const intervalsSinceSpawn = Math.max(0, currentInterval - spawnInterval);
      
      let scale = BASE_SCALE;
      for (let j = 0; j < intervalsSinceSpawn; j++) {
        scale += data.growthRate;
        if (scale >= data.maxScale) {
          scale = data.maxScale;
          break;
        }
      }
      
      scale = Math.min(scale, data.maxScale);
      
      newFlowers.push({
        id: i,
        scale,
        position: data.position,
        variant: data.variant,
        colorTheme: data.colorTheme,
        maxScale: data.maxScale,
        growthRate: data.growthRate,
        spawnDelay: data.spawnDelay,
      });
    }
    
    setFlowers(newFlowers);
  }, [totalMinutes]);

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
          style={{ 
            left: `${flower.position}%`,
            zIndex: Math.floor(flower.maxScale * 10)
          }}
        />
      ))}
    </div>
  );
}
