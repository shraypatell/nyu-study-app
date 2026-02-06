"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PillNav from "@/components/PillNav";
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
  chatRoomId: string | null;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [joining, setJoining] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState("browse");
  const limit = 32;

  useEffect(() => {
    fetchClasses(1, searchQuery);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      fetchClasses(1, searchQuery);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    fetchClasses(page, searchQuery);
  }, [page]);

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchClasses = async (pageNumber: number, query: string) => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageNumber));
      params.set("limit", String(limit));
      if (query) params.set("search", query);
      const response = await fetch(`/api/classes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
        setTotalCount(data.totalCount || 0);
        setTotalPages(Math.min(100, data.totalPages || 1));
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyClasses = async () => {
    try {
      const response = await fetch("/api/classes?joined=true");
      if (response.ok) {
        const data = await response.json();
        setMyClasses(data.classes);
      }
    } catch (error) {
      console.error("Failed to fetch my classes:", error);
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
        fetchMyClasses();
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
        fetchMyClasses();
      }
    } catch (error) {
      console.error("Failed to leave class:", error);
    } finally {
      setLeaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-10 px-4">
      <div className="glass-panel rounded-3xl px-6 py-6 mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Classes</h1>
        <p className="text-muted-foreground">Find classes, join chats, and manage your study groups.</p>
      </div>

      <PillNav
        items={[
          { label: "Browse", value: "browse" },
          { 
            label: "My Classes", 
            value: "my-classes",
            badge: myClasses.length > 0 ? (
              <Badge variant="secondary" className="ml-2">
                {myClasses.length}
              </Badge>
            ) : undefined
          }
        ]}
        activeValue={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      />

      {activeTab === "browse" && (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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

          <div className="text-sm text-muted-foreground mb-4">
            {totalCount} classes total
          </div>

          <div className="space-y-3">
            {classes.map((cls) => (
              <Card key={cls.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">{cls.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {cls.code}
                        {cls.section && ` - Section ${cls.section}`}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{cls.semester}</Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {cls.memberCount}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {cls.isJoined ? (
                        <>
                          <Link href={cls.chatRoomId ? `/chat/room/${cls.chatRoomId}` : "#"}>
                            <Button variant="outline" size="sm" disabled={!cls.chatRoomId}>
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

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(1)}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
              >
                Last
              </Button>
            </div>
          </div>
        </>
      )}

      {activeTab === "my-classes" && (
        <>
          {myClasses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">You haven&apos;t joined any classes yet</p>
              <p className="text-sm mt-2">
                Browse the available classes and join the ones you&apos;re taking
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myClasses.map((cls) => (
                <Card key={cls.id} className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{cls.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {cls.code}
                          {cls.section && ` - Section ${cls.section}`}
                        </p>
                      </div>
                      <Badge variant="outline">{cls.semester}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {cls.memberCount} members
                      </div>
                      <div className="flex gap-2">
                        <Link href={cls.chatRoomId ? `/chat/room/${cls.chatRoomId}` : "#"}>
                          <Button variant="outline" size="sm" disabled={!cls.chatRoomId}>
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
        </>
      )}
    </div>
  );
}
