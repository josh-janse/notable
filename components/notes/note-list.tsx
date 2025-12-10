import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";
import { NoteCard } from "./note-card";

type Note = Database["public"]["Tables"]["notes"]["Row"] & {
  client?: {
    full_name: string;
  };
  note_template?: {
    name: string;
  };
};

type NoteListProps = {
  clientId?: string;
  status?: "draft" | "completed" | "approved";
  limit?: number;
};

export async function NoteList({
  clientId,
  status,
  limit = 50,
}: NoteListProps) {
  const supabase = await createClient();

  let query = supabase
    .from("notes")
    .select(
      `
      *,
      client:clients!notes_client_id_fkey(full_name),
      note_template:note_templates!notes_template_id_fkey(name)
    `
    )
    .order("session_date", { ascending: false })
    .limit(limit);

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data: notes, error } = await query;

  if (error) {
    console.error("Error fetching notes:", error);
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-destructive text-sm">
          Failed to load notes. Please try again.
        </p>
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="rounded-md border border-border bg-muted/50 p-8 text-center">
        <p className="text-muted-foreground">No notes found.</p>
        <p className="mt-1 text-muted-foreground text-sm">
          Create your first note to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">
          Notes {status && <Badge variant="outline">{status}</Badge>}
        </h2>
        <p className="text-muted-foreground text-sm">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </p>
      </div>

      <div className="grid gap-4">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note as Note} showClient={!clientId} />
        ))}
      </div>
    </div>
  );
}
