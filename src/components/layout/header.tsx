"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  LogOut,
  User,
  Menu,
  ChevronDown,
  Building2,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  onMobileMenuToggle?: () => void;
}

export function Header({ user, onMobileMenuToggle }: HeaderProps) {
  const firstName = user.name?.split(" ")[0] || "User";
  const lastName = user.name?.split(" ")[1] || "";
  const initials = getInitials(firstName, lastName);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold text-gray-900">
            Welcome back, {firstName}!
          </h2>
          <p className="text-sm text-gray-500">
            Here&apos;s what&apos;s happening in your society today.
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Society Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
          <Building2 className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Green Valley Society
          </span>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
          >
            3
          </Badge>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500 hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <Badge variant="secondary" className="w-fit text-[10px]">
                  {user.role?.replace("_", " ")}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
