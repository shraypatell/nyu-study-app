import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Trophy, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            NYU Study App
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Track your study time, compete with friends, and climb the leaderboards. 
            Join the NYU study community today!
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <Clock className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle>Track Study Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Start a timer and track your daily study sessions automatically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Trophy className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle>Leaderboards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Compete with your school and see who&apos;s studying the most.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Users className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle>Friend System</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Add friends, see their study progress, and motivate each other.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <MessageSquare className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle>Study Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Join class chat rooms and connect with study partners.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-2xl mx-auto bg-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to Start Studying?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6">
              Join thousands of NYU students tracking their study time and achieving their goals.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary">
                Create Free Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <footer className="container mx-auto px-4 py-8 text-center text-gray-500">
        <p>© 2025 NYU Study App. Built for NYU students.</p>
      </footer>
    </div>
  );
}
