"use client";

import { useState, useEffect } from "react";
import NumberFlow from "@number-flow/react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Clock } from "lucide-react";

interface TimerContainerProps {
  userId: string;
}

const STORAGE_KEY = "selectedStudyClass";

export default function TimerContainer({ userId }: TimerContainerProps) {
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentClass, setCurrentClass] = useState<{ id: string; name: string; code: string } | null>(null);

  useEffect(() => {
    fetchTimerStatus();
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = Date.now();

    if (isActive) {
      const tick = () => {
        const now = Date.now();
        const delta = Math.floor((now - lastTime) / 1000);
        if (delta >= 1) {
          setElapsedTime((prev) => prev + delta);
          lastTime = now;
        }
        animationFrameId = requestAnimationFrame(tick);
      };
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      fetchTimerStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const heartbeatInterval = setInterval(async () => {
      try {
        await fetch("/api/timer/heartbeat", { method: "POST" });
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [isActive]);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (isActive) {
        await fetch("/api/timer/pause", {
          method: "POST",
          keepalive: true,
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isActive]);

  const fetchTimerStatus = async () => {
    try {
      const response = await fetch("/api/timer/status");
      if (response.ok) {
        const data = await response.json();
        setIsActive(data.isActive);
        setElapsedTime(data.currentDuration || 0);
        setTotalTimeToday(data.totalSecondsToday);
        setCurrentClass(data.currentClass || null);
      }
    } catch (error) {
      console.error("Failed to fetch timer status:", error);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const storedClassId = localStorage.getItem(STORAGE_KEY);
      const response = await fetch("/api/timer/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: storedClassId || null }),
      });
      if (response.ok) {
        setIsActive(true);
        setElapsedTime(0);
      }
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
    setLoading(false);
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/timer/pause", {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setIsActive(false);
        setElapsedTime(0);
        setTotalTimeToday((prev) => prev + data.totalDuration);
      }
    } catch (error) {
      console.error("Failed to pause timer:", error);
    }
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeParts = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return { hours, minutes, secs };
  };

  return (
    <div className="w-full">
      <div className="text-center space-y-6">
        <div className="inline-flex flex-col items-center justify-center px-2">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground mb-2">
            Session Timer
          </div>
          <div
            className={`text-[clamp(3rem,6vw,5rem)] leading-none font-sans font-semibold tracking-tight tabular-nums ${
              isActive ? "text-success" : "text-foreground"
            }`}
          >
            {(() => {
              const { hours, minutes, secs } = getTimeParts(elapsedTime);
              return (
                <span className="inline-flex items-center gap-1">
                  <NumberFlow value={hours} format={{ minimumIntegerDigits: 2 }} />
                  <span>:</span>
                  <NumberFlow value={minutes} format={{ minimumIntegerDigits: 2 }} />
                  <span>:</span>
                  <NumberFlow value={secs} format={{ minimumIntegerDigits: 2 }} />
                </span>
              );
            })()}
          </div>
          <div className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
            Total Time
          </div>
          <div className="mt-2 text-[clamp(1rem,2vw,1.4rem)] font-sans font-semibold tracking-tight text-foreground">
            {(() => {
              const { hours, minutes, secs } = getTimeParts(totalTimeToday + elapsedTime);
              return (
                <span className="inline-flex items-center gap-1">
                  <NumberFlow value={hours} format={{ minimumIntegerDigits: 2 }} />
                  <span>:</span>
                  <NumberFlow value={minutes} format={{ minimumIntegerDigits: 2 }} />
                  <span>:</span>
                  <NumberFlow value={secs} format={{ minimumIntegerDigits: 2 }} />
                </span>
              );
            })()}
          </div>
        </div>

        <div className="flex justify-center gap-3">
          {!isActive ? (
          <Button
            onClick={handleStart}
            disabled={loading}
            variant="outline"
            size="icon"
            aria-label="Start studying"
            className="h-14 w-14 glass-card rounded-full hover:scale-105 transition-transform"
          >
            <Play className="h-5 w-5" />
          </Button>
          ) : (
          <Button
            onClick={handlePause}
            disabled={loading}
            variant="outline"
            size="icon"
            aria-label="Pause studying"
            className="h-14 w-14 glass-card rounded-full hover:scale-105 transition-transform"
          >
            <Pause className="h-5 w-5" />
          </Button>
          )}
        </div>

        {currentClass && (
          <div className="text-sm text-muted-foreground">
            Studying for <span className="font-medium text-foreground">{currentClass.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
