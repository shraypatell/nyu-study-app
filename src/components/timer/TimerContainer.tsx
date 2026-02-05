"use client";

import { useState, useEffect } from "react";
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

  return (
    <div className="w-full">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-2 text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          Focus Timer
        </div>

        <div className="glass-glow inline-flex flex-col items-center justify-center rounded-[36px] px-10 py-8">
          <p className="text-sm font-medium text-muted-foreground">Current Session</p>
          <div
            className={`mt-2 text-[clamp(2.75rem,5vw,4.5rem)] leading-none font-sans font-semibold tracking-tight tabular-nums ${
              isActive ? "text-success" : "text-foreground"
            }`}
          >
            {formatTime(elapsedTime)}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="glass-chip rounded-full px-4 py-2 text-sm text-muted-foreground">
            Total Today: {formatTime(totalTimeToday + elapsedTime)}
          </div>
          {isActive && (
            <div className="glass-chip rounded-full px-4 py-2 text-sm text-success flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Studying...
            </div>
          )}
        </div>

        <div className="flex justify-center">
          {!isActive ? (
            <Button
              onClick={handleStart}
              disabled={loading}
              className="px-10 py-3 text-base font-semibold"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Studying
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              disabled={loading}
              variant="outline"
              className="px-10 py-3 text-base font-semibold"
            >
              <Pause className="h-5 w-5 mr-2" />
              Pause
            </Button>
          )}
        </div>

        {currentClass && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 glass-chip rounded-full text-sm text-muted-foreground">
            <span>Studying for</span>
            <span className="font-medium text-primary">
              {currentClass.name} ({currentClass.code})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
