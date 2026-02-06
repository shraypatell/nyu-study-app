"use client";

import { useState, useEffect } from "react";
import FlowerGarden from "@/components/FlowerGarden";
import GardenHelpButton from "@/components/GardenHelpButton";
import DashboardLiveWidgets from "@/components/dashboard/DashboardLiveWidgets";
import StudyContextMenu from "@/components/dashboard/StudyContextMenu";
import TimerContainer from "@/components/timer/TimerContainer";

interface DashboardClientProps {
  userId: string;
  initialData: {
    locationName: string | null;
    locationId: string | null;
    locationLeaderboard: any[];
    schoolLeaderboard: any[];
    friends: any[];
    userTotalSeconds: number;
  };
}

export default function DashboardClient({ userId, initialData }: DashboardClientProps) {
  const [totalMinutes, setTotalMinutes] = useState(Math.floor(initialData.userTotalSeconds / 60));

  useEffect(() => {
    const updateFlowers = () => {
      fetch("/api/timer/status")
        .then((res) => res.json())
        .then((data) => {
          if (data.totalSecondsToday !== undefined) {
            const currentSessionSeconds = data.isActive && data.currentDuration ? data.currentDuration : 0;
            const totalSeconds = data.totalSecondsToday + currentSessionSeconds;
            setTotalMinutes(Math.floor(totalSeconds / 60));
          }
        })
        .catch(() => {});
    };

    updateFlowers();
    const interval = setInterval(updateFlowers, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 pb-48">
      <FlowerGarden totalMinutes={totalMinutes} />
      
      <div className="absolute top-4 right-4 sm:right-6 lg:right-8 z-20">
        <StudyContextMenu />
      </div>
      
      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        <div className="flex justify-center py-12">
          <div className="w-full max-w-3xl">
            <TimerContainer userId={userId} />
          </div>
        </div>

        <DashboardLiveWidgets
          initialLocationName={initialData.locationName}
          initialLocationId={initialData.locationId}
          initialLocationLeaderboard={initialData.locationLeaderboard}
          initialSchoolLeaderboard={initialData.schoolLeaderboard}
          initialFriends={initialData.friends}
        />
      </div>

      <GardenHelpButton />
    </div>
  );
}
