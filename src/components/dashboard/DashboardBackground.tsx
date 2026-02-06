"use client";

import { useState, useEffect } from "react";
import Ballpit from "@/components/Ballpit";

interface DashboardBackgroundProps {
  initialTotalSeconds: number;
}

export default function DashboardBackground({ initialTotalSeconds }: DashboardBackgroundProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialTotalSeconds);

  useEffect(() => {
    const updateBallCount = () => {
      fetch("/api/timer/status")
        .then((res) => res.json())
        .then((data) => {
          if (data.totalSecondsToday !== undefined) {
            const currentSessionSeconds = data.isActive && data.currentDuration ? data.currentDuration : 0;
            setTotalSeconds(data.totalSecondsToday + currentSessionSeconds);
          }
        })
        .catch(() => {});
    };

    updateBallCount();
    const interval = setInterval(updateBallCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const baseBalls = 10;
  const ballsPerFiveMinutes = 5;
  const fiveMinuteIntervals = Math.floor(totalSeconds / 300);
  const ballCount = Math.min(
    baseBalls + fiveMinuteIntervals * ballsPerFiveMinutes,
    1450
  );

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 w-full h-full pointer-events-auto">
        <Ballpit
          count={ballCount}
          gravity={0.03}
          friction={1.0}
          wallBounce={1.0}
          followCursor={true}
          minSize={0.25}
          maxSize={0.5}
          colors={[0xcccccc, 0xdddddd, 0xeeeeee, 0xffffff]}
        />
      </div>
    </div>
  );
}
