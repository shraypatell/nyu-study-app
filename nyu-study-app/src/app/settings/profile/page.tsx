"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  usernameChanges: number;
  createdAt: string;
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
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
          username: data.user.username || "",
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
      const updateData: Record<string, unknown> = {
        displayName: formData.displayName || null,
        bio: formData.bio || null,
        avatarUrl: formData.avatarUrl || null,
        isTimerPublic: formData.isTimerPublic,
        isClassesPublic: formData.isClassesPublic,
        isLocationPublic: formData.isLocationPublic,
      };

      if (formData.username !== profile?.username) {
        updateData.username = formData.username;
      }

      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
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

  const checkUsernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username || username === profile?.username) {
      setUsernameError(null);
      return;
    }

    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setUsernameError("Username can only contain letters, numbers, underscores, and hyphens");
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError(null);

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(username)}`);
      if (response.ok) {
        const data = await response.json();
        const exists = data.users.some((u: { username: string }) => u.username.toLowerCase() === username.toLowerCase());
        if (exists) {
          setUsernameError("Username is already taken");
        }
      }
    } catch (err) {
      console.error("Failed to check username availability", err);
    } finally {
      setIsCheckingUsername(false);
    }
  }, [profile?.username]);

  const handleUsernameChange = (value: string) => {
    setFormData({ ...formData, username: value });
    setUsernameError(null);

    if (checkUsernameTimeoutRef.current) {
      clearTimeout(checkUsernameTimeoutRef.current);
    }

    checkUsernameTimeoutRef.current = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500);
  };

  const remainingChanges = profile ? 2 - profile.usernameChanges : 0;
  const canChangeUsername = remainingChanges > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-10 px-4">
      <div className="glass-panel rounded-3xl px-6 py-6 mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your profile, privacy, and public visibility.</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            Profile updated successfully!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update your public profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    disabled={!canChangeUsername}
                    className={canChangeUsername ? "" : "opacity-70"}
                    maxLength={30}
                  />
                {isCheckingUsername && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {usernameError && (
                <p className="text-sm text-error">{usernameError}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {canChangeUsername ? (
                  <>
                    {remainingChanges} username change{remainingChanges !== 1 ? "s" : ""} remaining. Must be 3-30 characters, letters, numbers, underscores, hyphens only.
                  </>
                ) : (
                  <>
                    You have used all 2 username changes. Username cannot be changed anymore.
                  </>
                )}
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
                placeholder="What you want to be called"
                maxLength={50}
              />
              <p className="text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
                {formData.bio.length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Profile Picture</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({ ...formData, avatarUrl: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <p className="text-sm text-muted-foreground">
                Choose an image from your device (optional)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
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
                <p className="text-sm text-muted-foreground">
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
                <p className="text-sm text-muted-foreground">
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
                <p className="text-sm text-muted-foreground">
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
          <Button type="submit" disabled={saving || !!usernameError} size="lg">
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
