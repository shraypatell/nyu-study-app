"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, User } from "lucide-react";
import { useDebounce } from "use-debounce";
import Link from "next/link";

interface SearchUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isTimerPublic: boolean;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const searchUsers = useCallback(
    async (searchQuery: string, cursor?: string) => {
      if (searchQuery.length < 2) {
        setUsers([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      try {
        const url = new URL("/api/users/search", window.location.origin);
        url.searchParams.set("q", searchQuery);
        if (cursor) {
          url.searchParams.set("cursor", cursor);
        }

        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          if (cursor) {
            setUsers((prev) => [...prev, ...data.users]);
          } else {
            setUsers(data.users);
          }
          setHasMore(data.hasMore);
          setNextCursor(data.nextCursor);
          setHasSearched(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useState(() => {
    if (debouncedQuery) {
      searchUsers(debouncedQuery);
    }
  });

  const handleLoadMore = () => {
    if (nextCursor) {
      searchUsers(debouncedQuery, nextCursor);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Find Students</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Search by username or name..."
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setQuery(e.target.value)
          }
          className="pl-10 h-12 text-lg"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-gray-400" />
        )}
      </div>

      {!hasSearched && query.length < 2 && (
        <div className="text-center py-12 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Type at least 2 characters to search</p>
        </div>
      )}

      {hasSearched && users.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No students found</p>
          <p className="text-sm mt-2">Try a different search term</p>
        </div>
      )}

      <div className="space-y-3">
        {users.map((user) => (
          <Link key={user.id} href={`/users/${user.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">
                      {user.displayName || user.username}
                    </h3>
                    {user.isTimerPublic && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-100 text-green-700"
                      >
                        Studying
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <Button onClick={handleLoadMore} variant="outline" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
