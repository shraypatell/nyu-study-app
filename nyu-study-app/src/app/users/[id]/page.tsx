"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageCircle, UserPlus, Clock, MapPin, BookOpen } from "lucide-react";
import Link from "next/link";

interface PublicProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  timer?: {
    isActive: boolean;
    startedAt: string;
    currentDuration: number;
  } | null;
  classes?: Array<{
    id: string;
    name: string;
    code: string;
    section: string | null;
    semester: string;
  }> | null;
  location?: {
    id: string;
    name: string;
    slug: string;
    parent?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  } | null;
  session?: {
    isActive: boolean;
    startedAt: string;
    endedAt: string | null;
  } | null;
}

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<"none" | "pending" | "accepted">("none");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else if (response.status === 404) {
        setError("User not found");
      } else {
        setError("Failed to load profile");
      }
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    setSendingRequest(true);
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setFriendshipStatus("pending");
      }
    } catch (error) {
      console.error("Failed to send friend request:", error);
    } finally {
      setSendingRequest(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = (profileData: PublicProfile) => {
    if (!profileData.session) return null;
    const startedAt = new Date(profileData.session.startedAt).getTime();
    const endedAt = profileData.session.endedAt
      ? new Date(profileData.session.endedAt).getTime()
      : null;

    if (profileData.session.isActive) {
      const durationSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
      const locationText = profileData.location?.name
        ? profileData.location.parent
          ? ` at ${profileData.location.name} in ${profileData.location.parent.name}`
          : ` at ${profileData.location.name}`
        : "";
      return `Studying ${formatTime(durationSeconds)}${locationText}`;
    }

    const endTime = endedAt ?? startedAt;
    const elapsedMinutes = Math.max(0, Math.floor((now - endTime) / 60000));
    const days = Math.floor(elapsedMinutes / 1440);
    const hours = Math.floor((elapsedMinutes % 1440) / 60);
    const minutes = elapsedMinutes % 60;
    let elapsedText = "";

    if (days > 0) {
      elapsedText = `Active ${days}d ${hours}h ago`;
    } else if (hours > 0) {
      elapsedText = `Active ${hours}h ${minutes}m ago`;
    } else {
      elapsedText = `Active ${minutes}m ago`;
    }

    const locationText = profileData.location?.name
      ? profileData.location.parent
        ? ` at ${profileData.location.name} in ${profileData.location.parent.name}`
        : ` at ${profileData.location.name}`
      : "";
    return `${elapsedText}${locationText}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || "Error"}</h1>
        <p className="text-gray-500">This user may not exist or their profile is private.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="bg-purple-100 text-purple-700 text-2xl">
                {profile.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-gray-500">@{profile.username}</p>

              {profile.bio && (
                <p className="mt-3 text-gray-700">{profile.bio}</p>
              )}

              <div className="flex gap-2 mt-4">
                <Link href={`/chat/${profile.id}`}>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </Link>

                {friendshipStatus === "none" && (
                  <Button
                    size="sm"
                    onClick={sendFriendRequest}
                    disabled={sendingRequest}
                  >
                    {sendingRequest ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Add Friend
                  </Button>
                )}

                {friendshipStatus === "pending" && (
                  <Button variant="secondary" size="sm" disabled>
                    Request Sent
                  </Button>
                )}

                {friendshipStatus === "accepted" && (
                  <Button variant="secondary" size="sm" disabled>
                    Friends
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timer">Timer</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
        </TabsList>

        <TabsContent value="timer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Study Timer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.timer ? (
                <div className="text-center py-8">
                  <div className="text-5xl font-mono font-bold text-green-600 mb-2">
                    {formatTime(profile.timer.currentDuration)}
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Currently Studying
                  </Badge>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Not studying right now</p>
                </div>
              )}
              {getStatusText(profile) && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  {getStatusText(profile)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.classes && profile.classes.length > 0 ? (
                <div className="space-y-3">
                  {profile.classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{cls.name}</p>
                        <p className="text-sm text-gray-500">
                          {cls.code}
                          {cls.section && ` - Section ${cls.section}`}
                        </p>
                      </div>
                      <Badge variant="outline">{cls.semester}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No classes to display</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Study Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.location ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                  <p className="text-xl font-medium">{profile.location.name}</p>
                  {profile.location.parent && (
                    <p className="text-gray-500 mt-1">in {profile.location.parent.name}</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No location set</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
