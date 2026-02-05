"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";

interface LocationParent {
  id: string;
  name: string;
  slug: string;
}

interface LocationChild {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface LocationOption {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parent: LocationParent | null;
  children: LocationChild[];
  isParent: boolean;
}

export default function LocationSelector() {
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationOption | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const parentLocations = locations.filter((loc) => loc.isParent || !loc.parent);
  const selectedParent = locations.find((loc) => loc.id === selectedParentId);
  const availableChildren = selectedParent?.children || [];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [locationsResponse, currentResponse] = await Promise.all([
          fetch("/api/locations"),
          fetch("/api/user/location"),
        ]);

        if (!locationsResponse.ok) {
          throw new Error("Failed to load locations");
        }

        const locationsData = await locationsResponse.json();
        setLocations(locationsData.locations || []);

        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          const loc = currentData.location;
          setCurrentLocation(loc);
          if (loc) {
            if (loc.parent) {
              setSelectedParentId(loc.parent.id);
              setSelectedLocationId(loc.id);
            } else {
              const parentLoc = locationsData.locations?.find(
                (l: LocationOption) => l.id === loc.id && l.isParent
              );
              if (parentLoc) {
                setSelectedParentId(loc.id);
              } else {
                setSelectedLocationId(loc.id);
              }
            }
          }
        }
      } catch (err) {
        setError("Unable to load locations");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleParentChange = (parentId: string) => {
    setSelectedParentId(parentId);
    setSelectedLocationId("");
    setError(null);
    setSuccess(null);
  };

  const handleUpdateLocation = async () => {
    const locationIdToSave = selectedLocationId || selectedParentId;
    if (!locationIdToSave) {
      setError("Select a location first");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/user/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: locationIdToSave }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update location");
      }

      const data = await response.json();
      setCurrentLocation(data.location || null);
      setSuccess("Location updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update location");
    } finally {
      setSaving(false);
    }
  };

  const formatLocationName = (location: LocationOption | null) => {
    if (!location) return "Not set";
    if (location.parent) {
      return `${location.name} in ${location.parent.name}`;
    }
    return location.name;
  };

  return (
    <Card className="w-full glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <MapPin className="h-5 w-5 text-primary" />
          Study Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Current Location
              </label>
              <div className="glass-panel rounded-xl px-3 py-2 text-sm text-foreground">
                {formatLocationName(currentLocation)}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Main Location
              </label>
              <select
                value={selectedParentId}
                onChange={(e) => handleParentChange(e.target.value)}
                className="w-full h-10 rounded-xl glass-select px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              >
                <option value="">Select a main location</option>
                {parentLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedParentId && availableChildren.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Specific Area (optional)
                </label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full h-10 rounded-xl glass-select px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                >
                  <option value="">Select a specific area (or use main location)</option>
                  {availableChildren.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <p className="text-sm text-error font-medium">{error}</p>
            )}
            {success && (
              <p className="text-sm text-success font-medium">{success}</p>
            )}

            <Button
              onClick={handleUpdateLocation}
              disabled={saving}
              className="w-full font-medium"
            >
              {saving ? "Updating..." : "Set Location"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
