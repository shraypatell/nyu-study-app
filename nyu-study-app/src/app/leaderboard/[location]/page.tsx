"use client";

import { useParams } from "next/navigation";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

export default function LocationLeaderboardPage() {
  const params = useParams();
  const locationId = params.location as string;

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Location Leaderboard</h1>
      <LeaderboardTable locationId={locationId} />
    </div>
  );
}
