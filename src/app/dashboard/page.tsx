import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TimerContainer from "@/components/timer/TimerContainer";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Study Timer</h1>
          <p className="text-gray-600 mt-2">Track your study sessions and compete on leaderboards</p>
        </div>

        <TimerContainer userId={user.id} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <h3 className="font-semibold text-gray-700">Quick Links</h3>
            <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <h3 className="font-semibold text-gray-700">Leaderboard</h3>
            <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <h3 className="font-semibold text-gray-700">Friends</h3>
            <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
