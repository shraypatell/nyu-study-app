"use client";

import { useParams } from "next/navigation";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

export default function LocationLeaderboardPage() {
  const params = useParams();
  const locationId = params.location as string;

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <div className="glass-panel rounded-3xl px-6 py-6 mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Location Leaderboard</h1>
        <p className="text-muted-foreground">Track study momentum at this location.</p>
      </div>
      <LeaderboardTable locationId={locationId} />
    </div>
  );
}
