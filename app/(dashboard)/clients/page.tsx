/**
 * Clients List Page
 *
 * Server Component that displays all clients for the authenticated practitioner.
 * Supports search, filtering, and pagination via URL search params.
 */

import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientList } from "@/components/clients/client-list";
import { ClientSearch } from "@/components/clients/client-search";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

type PageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
};

export default async function ClientsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Parse query parameters
  const search = params.search || "";
  const status = params.status || undefined;
  const page = Number.parseInt(params.page || "1", 10);
  const limit = 20;

  // Build query
  let query = supabase
    .from("clients")
    .select("*", { count: "exact" })
    .eq("practitioner_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  // Apply search
  if (search) {
    query = query.ilike("full_name", `%${search}%`);
  }

  // Apply status filter
  if (status) {
    query = query.eq("status", status);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  // Execute query
  const { data: clients, error, count } = await query;

  if (error) {
    console.error("Error fetching clients:", error);
    return (
      <div className="container py-8">
        <div className="space-y-6">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">Clients</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your client profiles and view their progress
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">
                Error loading clients. Please try again.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-muted-foreground">
              Manage your client profiles and view their progress
            </p>
          </div>
          <Button asChild className="sm:shrink-0">
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              New Client
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientSearch defaultValue={search} />
          </CardContent>
        </Card>

        {/* Client List */}
        <ClientList
          clients={(clients as Client[]) || []}
          currentPage={page}
          pageSize={limit}
          totalCount={count || 0}
        />
      </div>
    </div>
  );
}
