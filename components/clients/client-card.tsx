/**
 * Client Card Server Component
 *
 * Displays a single client as a card in the client list.
 * Links to the client detail page.
 */

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/lib/types/database.types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

type ClientCardProps = {
  client: Client;
};

export function ClientCard({ client }: ClientCardProps) {
  const statusColors = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    inactive:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };

  const status = (client.status as keyof typeof statusColors) || "active";
  const formattedDate = client.created_at
    ? new Date(client.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="h-full cursor-pointer transition-colors hover:border-primary">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{client.full_name}</CardTitle>
            <Badge className={statusColors[status]} variant="secondary">
              {status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {client.email && (
            <p className="truncate text-muted-foreground text-sm">
              {client.email}
            </p>
          )}
          {client.phone && (
            <p className="text-muted-foreground text-sm">{client.phone}</p>
          )}
          {formattedDate && (
            <p className="text-muted-foreground text-xs">
              Added on {formattedDate}
            </p>
          )}
          {client.notes_summary && (
            <p className="mt-2 line-clamp-2 text-muted-foreground text-sm">
              {client.notes_summary}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
