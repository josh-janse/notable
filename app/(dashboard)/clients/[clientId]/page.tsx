/**
 * Client Detail Page
 *
 * Server Component displaying individual client information.
 * Refactored to use Sticky Header + Note List layout.
 */

import { notFound, redirect } from "next/navigation";
import { ClientHeader } from "@/components/clients/client-header";
import { NoteList } from "@/components/notes/note-list";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function ClientDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const { clientId } = await params;

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch client details
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("practitioner_id", user.id)
    .single();

  if (error || !client) {
    notFound();
  }

  // Fetch last note for "Last Visit"
  const { data: lastNote } = await supabase
    .from("notes")
    .select("session_date")
    .eq("client_id", clientId)
    .not("session_date", "is", null)
    .order("session_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="container py-8">
      {/* Client Header */}
      <ClientHeader client={client} lastVisit={lastNote?.session_date} />

      {/* Main Content */}
      <div className="mt-6 space-y-6">
        {/* Note List */}
        <NoteList clientId={clientId} />
      </div>
    </div>
  );
}
