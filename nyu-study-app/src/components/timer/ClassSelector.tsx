"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen } from "lucide-react";

interface Class {
  id: string;
  name: string;
  code: string;
  section: string | null;
  semester: string;
}

const STORAGE_KEY = "selectedStudyClass";

export default function ClassSelector() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSelectedId(stored);
    }
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/classes?joined=true");
      if (!response.ok) {
        throw new Error("Failed to load classes");
      }
      const data = await response.json();
      setClasses(data.classes || []);
    } catch (err) {
      setError("Unable to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = (classId: string | null) => {
    setSelectedId(classId);
    if (classId) {
      localStorage.setItem(STORAGE_KEY, classId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedId);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Study Class
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Current Selection</label>
              <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {selectedClass
                  ? `${selectedClass.name} (${selectedClass.code})`
                  : "General Study"}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Class</label>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={selectedId === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleClassSelect(null)}
                  className="justify-start"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  General Study
                </Button>

                {classes.length > 0 ? (
                  classes.map((cls) => (
                    <Button
                      key={cls.id}
                      variant={selectedId === cls.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleClassSelect(cls.id)}
                      className="justify-start"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span className="truncate">{cls.name}</span>
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No classes joined yet. Visit the Classes page to join.
                  </p>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
