"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, BookOpen, Users, Check, MessageCircle } from "lucide-react";
import Link from "next/link";

interface Class {
  id: string;
  name: string;
  code: string;
  section: string | null;
  semester: string;
  memberCount: number;
  isJoined: boolean;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [joining, setJoining] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
        setMyClasses(data.classes.filter((c: Class) => c.isJoined));
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const joinClass = async (classId: string) => {
    setJoining(classId);
    try {
      const response = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
      });

      if (response.ok) {
        setClasses((prev) =>
          prev.map((c: Class) => (c.id === classId ? { ...c, isJoined: true } : c))
        );
        const joinedClass = classes.find((c: Class) => c.id === classId);
        if (joinedClass) {
          setMyClasses((prev) => [...prev, { ...joinedClass, isJoined: true }]);
        }
      }
    } catch (error) {
      console.error("Failed to join class:", error);
    } finally {
      setJoining(null);
    }
  };

  const leaveClass = async (classId: string) => {
    setLeaving(classId);
    try {
      const response = await fetch("/api/classes/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
      });

      if (response.ok) {
        setClasses((prev) =>
          prev.map((c: Class) => (c.id === classId ? { ...c, isJoined: false } : c))
        );
        setMyClasses((prev) => prev.filter((c: Class) => c.id !== classId));
      }
    } catch (error) {
      console.error("Failed to leave class:", error);
    } finally {
      setLeaving(null);
    }
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Classes</h1>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="my-classes">
            My Classes
            {myClasses.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {myClasses.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="pl-10"
            />
          </div>

          <div className="space-y-3">
            {filteredClasses.map((cls) => (
              <Card key={cls.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-4 w-4 text-purple-600" />
                        <h3 className="font-semibold">{cls.name}</h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        {cls.code}
                        {cls.section && ` - Section ${cls.section}`}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{cls.semester}</Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Users className="h-3 w-3" />
                          {cls.memberCount}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {cls.isJoined ? (
                        <>
                          <Link href={`/chat/class/${cls.id}`}>
                            <Button variant="outline" size="sm">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Chat
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => leaveClass(cls.id)}
                            disabled={leaving === cls.id}
                          >
                            {leaving === cls.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Leave"
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => joinClass(cls.id)}
                          disabled={joining === cls.id}
                        >
                          {joining === cls.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-classes" className="mt-6">
          {myClasses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">You haven&apos;t joined any classes yet</p>
              <p className="text-sm mt-2">
                Browse the available classes and join the ones you&apos;re taking
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myClasses.map((cls) => (
                <Card key={cls.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{cls.name}</CardTitle>
                        <p className="text-sm text-gray-500">
                          {cls.code}
                          {cls.section && ` - Section ${cls.section}`}
                        </p>
                      </div>
                      <Badge variant="outline">{cls.semester}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        {cls.memberCount} members
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/chat/class/${cls.id}`}>
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Class Chat
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => leaveClass(cls.id)}
                          disabled={leaving === cls.id}
                        >
                          {leaving === cls.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Leave"
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
