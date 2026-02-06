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
  layer: number;
}

interface FlowerGardenProps {
  totalMinutes: number;
}

const MAX_FLOWERS = 22;
const BASE_SCALE = 0.2;
const MAX_SCALE = 1.0;
const SPAWN_INTERVAL = 5;
const MAX_TIME_MINUTES = 360;

const LAYER_SCALES = {
  front: 0.5,
  middle: 0.75,
  back: 1.0
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
      const layerIndex = i % 3;
      const layerName = layerIndex === 0 ? 'back' : layerIndex === 1 ? 'middle' : 'front';
      const layerMaxScale = LAYER_SCALES[layerName];
      
      const scale = Math.min(
        layerMaxScale,
        BASE_SCALE + (currentInterval * (layerMaxScale - BASE_SCALE) / maxIntervals)
      );
      
      const position = calculateEvenPosition(i, targetFlowerCount);
      const colorTheme: 'cyan' | 'pink' = i % 2 === 0 ? 'cyan' : 'pink';
      
      newFlowers.push({
        id: i,
        scale,
        position,
        variant: ((i % 3) + 1) as 1 | 2 | 3,
        colorTheme,
        layer: layerIndex,
      });
    }
    
    setFlowers(newFlowers);
  }, [totalMinutes]);

  const calculateEvenPosition = (index: number, total: number): number => {
    if (total === 1) return 50;
    
    const startPercent = 8;
    const endPercent = 92;
    const availableSpace = endPercent - startPercent;
    
    const spacing = availableSpace / (MAX_FLOWERS - 1);
    
    return startPercent + (index * spacing);
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
          className={`flower-garden__flower flower-garden__flower--layer-${flower.layer}`}
          style={{ left: `${flower.position}%` }}
        />
      ))}
    </div>
  );
}
