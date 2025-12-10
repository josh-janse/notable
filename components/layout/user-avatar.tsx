"use client";

/**
 * User Avatar Component
 *
 * Displays user avatar from Vercel avatar endpoint and dropdown menu.
 * Used in simplified header for initial deployment.
 */

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserAvatarProps = {
  email: string;
  firstName?: string;
  lastName?: string;
};

export function UserAvatar({ email, firstName, lastName }: UserAvatarProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayName =
    firstName && lastName ? `${firstName} ${lastName}` : email;
  const avatarUrl = `https://avatar.vercel.sh/${encodeURIComponent(displayName)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="relative size-10 rounded-full"
          size="icon"
          variant="ghost"
        >
          <Avatar className="size-10">
            <AvatarImage alt={displayName} src={avatarUrl} />
            <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem disabled={isLoading} onClick={handleSignOut}>
          <LogOut className="mr-2 size-4" />
          <span>{isLoading ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
