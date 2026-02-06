"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, BookOpen, MapPin, MessageSquare, Clock, Trophy } from "lucide-react";

interface Stats {
  totalUsers: number;
  activeUsersToday: number;
  totalStudySessions: number;
  activeTimers: number;
  totalClasses: number;
  totalLocations: number;
  totalMessages: number;
  todaysTotalStudyTime: number;
}

interface TopStudier {
  username: string;
  displayName: string | null;
  totalSeconds: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topStudiers, setTopStudiers] = useState<TopStudier[]>([]);
  const [loading, setLoading] = useState(true);
  const [classJson, setClassJson] = useState("");
  const [locationJson, setLocationJson] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || ""}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setTopStudiers(data.topStudiers);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadClasses = async () => {
    setUploading(true);
    setUploadResult(null);
    try {
      const classes = JSON.parse(classJson);
      const response = await fetch("/api/admin/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || ""}`,
        },
        body: JSON.stringify(classes),
      });

      if (response.ok) {
        const data = await response.json();
        setUploadResult(
          `Created: ${data.summary.created}, Skipped: ${data.summary.skipped}, Errors: ${data.summary.errors}`
        );
        setClassJson("");
        fetchStats();
      } else {
        setUploadResult("Upload failed");
      }
    } catch (error) {
      setUploadResult("Invalid JSON format");
    } finally {
      setUploading(false);
    }
  };

  const uploadLocations = async () => {
    setUploading(true);
    setUploadResult(null);
    try {
      const locations = JSON.parse(locationJson);
      const response = await fetch("/api/admin/locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || ""}`,
        },
        body: JSON.stringify(locations),
      });

      if (response.ok) {
        const data = await response.json();
        setUploadResult(
          `Created: ${data.summary.created}, Skipped: ${data.summary.skipped}, Errors: ${data.summary.errors}`
        );
        setLocationJson("");
        fetchStats();
      } else {
        setUploadResult("Upload failed");
      }
    } catch (error) {
      setUploadResult("Invalid JSON format");
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="text-2xl font-bold">{stats?.totalUsers || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Active Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold">
                    {stats?.activeUsersToday || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Active Timers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <span className="text-2xl font-bold">
                    {stats?.activeTimers || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <span className="text-2xl font-bold">
                    {stats?.totalMessages || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                  <span className="text-2xl font-bold">
                    {stats?.totalClasses || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <span className="text-2xl font-bold">
                    {stats?.totalLocations || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2 glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Today&apos;s Total Study Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold">
                  {formatTime(stats?.todaysTotalStudyTime || 0)}
                </span>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Top Studiers Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topStudiers.map((studier, index) => (
                  <div
                    key={studier.username}
                    className="flex items-center justify-between p-3 glass-panel rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className={`${
                          index === 0
                            ? "bg-yellow-100 text-yellow-800"
                            : index === 1
                            ? "bg-gray-100 text-gray-800"
                            : index === 2
                            ? "bg-orange-100 text-orange-800"
                            : ""
                        }`}
                      >
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">
                        {studier.displayName || studier.username}
                      </span>
                    </div>
                    <span className="font-mono">{formatTime(studier.totalSeconds)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Upload Classes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Paste JSON array of classes. Format: {"[{ name, code, section?, semester }]"}
              </p>
              <Textarea
                value={classJson}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setClassJson(e.target.value)}
                placeholder={`[\n  {\n    "name": "Introduction to Economics",\n    "code": "ECON-UA-1",\n    "section": "001",\n    "semester": "Fall 2024"\n  }\n]`}
                rows={10}
                className="font-mono text-sm"
              />
              <Button
                onClick={uploadClasses}
                disabled={uploading || !classJson.trim()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload Classes"
                )}
              </Button>
              {uploadResult && (
                <p className="text-sm text-gray-600">{uploadResult}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Upload Locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Paste JSON array of locations. Format: {"[{ name, slug, description? }]"}
              </p>
              <Textarea
                value={locationJson}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLocationJson(e.target.value)}
                placeholder={`[\n  {\n    "name": "Bobst Library",\n    "slug": "bobst",\n    "description": "Main library at NYU"\n  }\n]`}
                rows={10}
                className="font-mono text-sm"
              />
              <Button
                onClick={uploadLocations}
                disabled={uploading || !locationJson.trim()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload Locations"
                )}
              </Button>
              {uploadResult && (
                <p className="text-sm text-gray-600">{uploadResult}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
