import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

export default function SchoolLeaderboardPage() {
  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">School Leaderboard</h1>
      <LeaderboardTable />
    </div>
  );
}
