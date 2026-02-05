"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  Trophy,
  BookOpen,
  MessageSquare,
  Search,
  Settings,
  Users,
  MapPin,
  Menu,
  LogOut,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface User {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Leaderboards", href: "/leaderboard", icon: Trophy, hoverClass: "hover:bg-[#cde6ff]" },
  { name: "Location Leaderboard", href: "/leaderboard", icon: MapPin, hoverClass: "hover:bg-[#f6c2c2]" },
  { name: "Classes", href: "/classes", icon: BookOpen },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Search", href: "/search", icon: Search },
  { name: "Friends", href: "/friends", icon: Users, hoverClass: "hover:bg-[#fff7bf]" },
];

const settingsItem = { name: "Settings", href: "/settings/profile", icon: Settings };
const SettingsIcon = settingsItem.icon;

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [locationHref, setLocationHref] = useState<string>("/leaderboard");
  const pathname = usePathname();

  useEffect(() => {
    fetchUser();
    fetchLocation();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/users/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const fetchLocation = async () => {
    try {
      const response = await fetch("/api/user/location");
      if (response.ok) {
        const data = await response.json();
        const locationId = data.location?.id as string | undefined;
        if (locationId) {
          setLocationHref(`/leaderboard/${locationId}`);
        }
      }
    } catch (error) {
      console.error("Failed to fetch location:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-16 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <header className="md:hidden sticky top-0 z-50">
        <div className="glass-panel rounded-2xl mx-4 mt-4 h-14 px-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/nyu.edu.png"
              alt="NYU"
              width={120}
              height={40}
              priority
              className="h-7 w-auto"
            />
          </Link>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="flex flex-col gap-2 mt-8">
                {navigation.map((item) => {
                  const itemHref = item.name === "Location Leaderboard" ? locationHref : item.href;
                  const isActive =
                    item.name === "Location Leaderboard"
                      ? pathname.startsWith("/leaderboard/")
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={itemHref}
                      onClick={() => setIsOpen(false)}
                    >
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={`w-full justify-start gap-3 ${item.hoverClass ?? ""}`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Button>
                    </Link>
                  );
                })}
                <div className="border-t my-2" />
                <Link href={settingsItem.href} onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <SettingsIcon className="h-4 w-4" />
                    {settingsItem.name}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <aside
        className={`relative hidden md:flex md:sticky md:top-0 md:h-screen md:flex-col md:justify-between md:py-6 md:px-4 glass-panel rounded-r-3xl ${
          isCollapsed ? "md:w-20" : "md:w-64"
        }`}
      >
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/nyu.edu.png"
                alt="NYU"
                width={140}
                height={48}
                priority
                className={`${isCollapsed ? "h-7 w-auto max-w-10" : "h-8 w-auto"} object-contain`}
              />
            </Link>
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex"
                onClick={() => setIsCollapsed(true)}
                aria-label="Collapse sidebar"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
          </div>

          <nav className="flex flex-col gap-1">
            {navigation.map((item) => {
              const itemHref = item.name === "Location Leaderboard" ? locationHref : item.href;
              const isActive =
                item.name === "Location Leaderboard"
                  ? pathname.startsWith("/leaderboard/")
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.name} href={itemHref}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={`w-full justify-start gap-3 ${isCollapsed ? "px-2" : "px-3"} ${
                      item.hoverClass ?? ""
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <Link href={settingsItem.href}>
            <Button
              variant={pathname.startsWith(settingsItem.href) ? "secondary" : "ghost"}
              size="sm"
              className={`w-full justify-start gap-3 ${isCollapsed ? "px-2" : "px-3"}`}
            >
              <SettingsIcon className="h-4 w-4" />
              {!isCollapsed && <span>{settingsItem.name}</span>}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`w-full justify-start gap-2 ${isCollapsed ? "px-2" : "px-3"}`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="glass-chip text-foreground text-xs">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {user.displayName || user.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @{user.username}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-4 top-8 hidden lg:inline-flex bg-[#f7f4ee] border border-[#cfcac0]"
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand sidebar"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </aside>
    </>
  );
}
