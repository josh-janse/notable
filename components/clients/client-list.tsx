/**
 * Client List Server Component
 *
 * Displays a table of clients with pagination support.
 * Fetches data server-side for optimal performance.
 */

import type { Database } from "@/lib/types/database.types";
import { ClientCard } from "./client-card";

type Client = Database["public"]["Tables"]["clients"]["Row"];

type ClientListProps = {
  clients: Client[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
};

export function ClientList({
  clients,
  totalCount,
  currentPage,
  pageSize,
}: ClientListProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No clients found.</p>
        <p className="mt-2 text-muted-foreground text-sm">
          Create your first client to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Client Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <ClientCard client={client} key={client.id} />
        ))}
      </div>

      {/* Pagination Info */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-muted-foreground text-sm">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
            clients
          </div>
          <div className="text-muted-foreground text-sm">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
}
