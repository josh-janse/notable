import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientDetailTabs } from "@/components/clients/client-detail-tabs";
import { NoteList } from "@/components/notes/note-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{
    status?: "draft" | "completed" | "approved";
  }>;
};

export default async function ClientNotesPage({
  params,
  searchParams,
}: PageProps) {
  const supabase = await createClient();
  const { clientId } = await params;
  const { status } = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("id", clientId)
    .eq("practitioner_id", user.id)
    .single();

  if (!client) {
    redirect("/clients");
  }

  return (
    <div className="container space-y-8 py-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="font-bold text-3xl tracking-tight">
            {client.full_name}
          </h1>
          <p className="text-muted-foreground">
            Session notes and documentation
          </p>
        </div>
        <Button asChild>
          <Link href="/notes/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Note
          </Link>
        </Button>
      </div>

      <ClientDetailTabs clientId={clientId} />

      <Card>
        <CardHeader>
          <CardTitle>Session Notes</CardTitle>
          <CardDescription>
            All notes for {client.full_name}, organized by session date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NoteList clientId={clientId} limit={50} status={status} />
        </CardContent>
      </Card>
    </div>
  );
}
