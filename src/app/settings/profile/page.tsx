"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isTimerPublic: boolean;
  isClassesPublic: boolean;
  isLocationPublic: boolean;
  createdAt: string;
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    avatarUrl: "",
    isTimerPublic: true,
    isClassesPublic: true,
    isLocationPublic: true,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/users/me");
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setFormData({
          displayName: data.user.displayName || "",
          bio: data.user.bio || "",
          avatarUrl: data.user.avatarUrl || "",
          isTimerPublic: data.user.isTimerPublic,
          isClassesPublic: data.user.isClassesPublic,
          isLocationPublic: data.user.isLocationPublic,
        });
      } else {
        setError("Failed to load profile");
      }
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: formData.displayName || null,
          bio: formData.bio || null,
          avatarUrl: formData.avatarUrl || null,
          isTimerPublic: formData.isTimerPublic,
          isClassesPublic: formData.isClassesPublic,
          isLocationPublic: formData.isLocationPublic,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        const data = await response.json();
        setProfile(data.user);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
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
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Profile updated successfully!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update your public profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile?.username || ""}
                disabled
                className="bg-gray-100"
              />
              <p className="text-sm text-gray-500">
                Username cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder="How you want to be called"
                maxLength={50}
              />
              <p className="text-sm text-gray-500">
                {formData.displayName.length}/50 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Tell others about yourself"
                maxLength={500}
                rows={4}
              />
              <p className="text-sm text-gray-500">
                {formData.bio.length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                value={formData.avatarUrl}
                onChange={(e) =>
                  setFormData({ ...formData, avatarUrl: e.target.value })
                }
                placeholder="https://example.com/avatar.jpg"
                type="url"
              />
              <p className="text-sm text-gray-500">
                Link to an image (optional)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>
              Control what others can see on your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="timer-public">Show Timer</Label>
                <p className="text-sm text-gray-500">
                  Allow others to see your current study time
                </p>
              </div>
              <Switch
                id="timer-public"
                checked={formData.isTimerPublic}
                onCheckedChange={(checked: boolean) =>
                  setFormData({ ...formData, isTimerPublic: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="classes-public">Show Classes</Label>
                <p className="text-sm text-gray-500">
                  Allow others to see which classes you&apos;re taking
                </p>
              </div>
              <Switch
                id="classes-public"
                checked={formData.isClassesPublic}
                onCheckedChange={(checked: boolean) =>
                  setFormData({ ...formData, isClassesPublic: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="location-public">Show Location</Label>
                <p className="text-sm text-gray-500">
                  Allow others to see where you&apos;re studying
                </p>
              </div>
              <Switch
                id="location-public"
                checked={formData.isLocationPublic}
                onCheckedChange={(checked: boolean) =>
                  setFormData({ ...formData, isLocationPublic: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
