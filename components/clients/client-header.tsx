"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { ClientEditDialog } from "@/components/clients/client-edit-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Database } from "@/lib/types/database.types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

type ClientHeaderProps = {
  client: Client;
  lastVisit?: Date | string | null;
};

export function ClientHeader({ client, lastVisit }: ClientHeaderProps) {
  const statusColors = {
    active: "bg-green-500",
    inactive: "bg-yellow-500",
    archived: "bg-gray-500",
  };

  const status = (client.status as keyof typeof statusColors) || "active";
  const statusColor = statusColors[status];

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) {
      return "N/A";
    }
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get initials for avatar
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <Card className="bg-card/50 p-6 shadow-sm">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-background shadow-sm">
              <AvatarImage
                alt={client.full_name}
                src={`https://avatar.vercel.sh/${client.id}`}
              />
              <AvatarFallback className="bg-primary/10 font-semibold text-lg text-primary">
                {getInitials(client.full_name)}
              </AvatarFallback>
            </Avatar>
            <div
              className={`absolute right-0 bottom-0 h-5 w-5 rounded-full border-2 border-background ${statusColor}`}
              title={`Status: ${status}`}
            />
          </div>

          <div className="space-y-2">
            <h1 className="font-bold text-2xl text-foreground tracking-tight">
              {client.full_name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
              <div className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Last Note: {formatDate(lastVisit)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row md:mt-0 md:w-auto">
          <div className="w-full sm:w-auto">
            <ClientEditDialog
              client={client}
              trigger={
                <Button className="w-full" variant="outline">
                  Edit Profile
                </Button>
              }
            />
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/notes/new?clientId=${client.id}`}>
              + New Session Note
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
