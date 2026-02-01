"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause } from "lucide-react";

interface TimerContainerProps {
  userId: string;
}

export default function TimerContainer({ userId }: TimerContainerProps) {
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [loading, setLoading] = useState(false);

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
      }
    } catch (error) {
      console.error("Failed to fetch timer status:", error);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/timer/start", {
        method: "POST",
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
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-2">Current Session</p>
            <div className={`text-6xl font-mono font-bold ${isActive ? "text-green-600" : "text-gray-700"}`}>
              {formatTime(elapsedTime)}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Total Today</p>
            <div className="text-2xl font-mono text-gray-600">
              {formatTime(totalTimeToday + elapsedTime)}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {!isActive ? (
              <Button
                onClick={handleStart}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Start
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                disabled={loading}
                variant="outline"
                className="px-8 py-6 text-lg"
              >
                <Pause className="mr-2 h-5 w-5" />
                Pause
              </Button>
            )}
          </div>

          {isActive && (
            <p className="text-sm text-green-600 animate-pulse">
              Studying...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
