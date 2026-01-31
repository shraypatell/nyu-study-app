"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";

interface LocationOption {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export default function LocationSelector() {
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationOption | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          setCurrentLocation(currentData.location || null);
          setSelectedLocationId(currentData.location?.id || "");
        }
      } catch (err) {
        setError("Unable to load locations");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleUpdateLocation = async () => {
    if (!selectedLocationId) {
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
        body: JSON.stringify({ locationId: selectedLocationId }),
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Study Location
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
              <label className="text-sm font-medium text-gray-700">Current</label>
              <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {currentLocation ? currentLocation.name : "Not set"}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Update location</label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="">Select a location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <Button onClick={handleUpdateLocation} disabled={saving} className="w-full">
              {saving ? "Updating..." : "Set Location"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
