import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

export default function SchoolLeaderboardPage() {
  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <div className="glass-panel rounded-3xl px-6 py-6 mb-8">
        <h1 className="text-3xl font-semibold text-foreground">School Leaderboard</h1>
        <p className="text-muted-foreground">See who is leading the campus today.</p>
      </div>
      <LeaderboardTable />
    </div>
  );
}
