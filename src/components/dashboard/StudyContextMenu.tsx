"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ClassSelector from "@/components/timer/ClassSelector";
import LocationSelector from "@/components/location/LocationSelector";

interface ClassItem {
  id: string;
  name: string;
  code: string;
}

interface LocationItem {
  id: string;
  name: string;
  parent?: { name: string } | null;
}

const STORAGE_KEY = "selectedStudyClass";

export default function StudyContextMenu() {
  const [open, setOpen] = useState(false);
  const [classLabel, setClassLabel] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  const refreshContext = async () => {
    try {
      const storedClassId = localStorage.getItem(STORAGE_KEY);
      if (storedClassId) {
        const response = await fetch("/api/classes?joined=true");
        if (response.ok) {
          const data = await response.json();
          const classes = (data.classes || []) as ClassItem[];
          const selected = classes.find((cls) => cls.id === storedClassId);
          setClassLabel(selected ? `${selected.name} (${selected.code})` : null);
        }
      } else {
        setClassLabel(null);
      }
    } catch {
      setClassLabel(null);
    }

    try {
      const response = await fetch("/api/user/location");
      if (response.ok) {
        const data = await response.json();
        const loc = data.location as LocationItem | null;
        if (loc) {
          const label = loc.parent ? `${loc.name} in ${loc.parent.name}` : loc.name;
          setLocationLabel(label);
        } else {
          setLocationLabel(null);
        }
      }
    } catch {
      setLocationLabel(null);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval) return;
      refreshContext();
      interval = setInterval(refreshContext, 10000);
    };

    const stopPolling = () => {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startPolling();
      } else {
        stopPolling();
      }
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const getTriggerText = () => {
    if (!classLabel && !locationLabel) {
      return "Select subject and location";
    }
    if (!classLabel && locationLabel) {
      return "Select subject";
    }
    if (classLabel && !locationLabel) {
      return "Select location";
    }
    return `Studying ${classLabel} at ${locationLabel}`;
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          refreshContext();
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="glass-panel max-w-none justify-between gap-2 text-left font-medium w-auto ml-auto px-2 py-1 text-sm"
        >
          <span className="whitespace-nowrap">{getTriggerText()}</span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={4}
        className="w-[320px] max-h-[70vh] overflow-y-auto p-3 glass-card rounded-2xl data-[state=open]:animate-dropdown-down data-[state=closed]:animate-dropdown-up"
      >
        <div className="space-y-4">
          <ClassSelector />
          <LocationSelector />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
