import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Trophy, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto glass-panel rounded-3xl px-8 py-10">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-3">
            NYU Study
          </p>
          <h1 className="text-5xl font-semibold text-foreground mb-6">
            Focus, flow, and campus collaboration.
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Track your study time, compete with friends, and climb the leaderboards. 
            Join the NYU study community today!
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">
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
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <Clock className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Track Study Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Start a timer and track your daily study sessions automatically.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <Trophy className="w-8 h-8 text-amber-500 mb-2" />
              <CardTitle>Leaderboards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Compete with your school and see who&apos;s studying the most.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <Users className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Friend System</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Add friends, see their study progress, and motivate each other.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <MessageSquare className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Study Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Join class chat rooms and connect with study partners.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-2xl mx-auto glass-card">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">Ready to Start Studying?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">
              Join thousands of NYU students tracking their study time and achieving their goals.
            </p>
            <Link href="/signup">
              <Button size="lg">
                Create Free Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        <p>© 2025 NYU Study App. Built for NYU students.</p>
      </footer>
    </div>
  );
}
