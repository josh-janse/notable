import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";

const updateNoteSchema = z.object({
  markdown_content: z.string().optional(),
  raw_transcription: z.string().optional(),
  extracted_fields: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["draft", "completed", "approved"]).optional(),
  session_date: z.string().datetime().optional(),
  next_session_date: z.string().date().optional(),
  follow_up_items: z.array(z.string()).optional(),
  duration_minutes: z.number().int().positive().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: note, error } = await supabase
      .from("notes")
      .select(
        `
        *,
        client:clients!notes_client_id_fkey(id, full_name, email),
        note_template:note_templates!notes_template_id_fkey(id, name, structure)
      `
      )
      .eq("id", noteId)
      .eq("practitioner_id", user.id)
      .single();

    if (error || !note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    return Response.json({ note });
  } catch (error) {
    console.error("GET /api/notes/[noteId] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = updateNoteSchema.safeParse(body);

    if (!validationResult.success) {
      return Response.json(
        {
          error: "Invalid request",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    const { data: existingNote, error: fetchError } = await supabase
      .from("notes")
      .select("id, practitioner_id")
      .eq("id", noteId)
      .single();

    if (fetchError || !existingNote) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    if (existingNote.practitioner_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatePayload: Partial<
      Database["public"]["Tables"]["notes"]["Update"]
    > = {
      markdown_content: updateData.markdown_content,
      raw_transcription: updateData.raw_transcription,
      extracted_fields: updateData.extracted_fields as
        | Database["public"]["Tables"]["notes"]["Update"]["extracted_fields"]
        | undefined,
      status: updateData.status,
      session_date: updateData.session_date,
      next_session_date: updateData.next_session_date,
      follow_up_items: updateData.follow_up_items,
      duration_minutes: updateData.duration_minutes,
    };

    if (updateData.status === "approved") {
      updatePayload.approved_at = new Date().toISOString();
    }

    const { data: updatedNote, error: updateError } = await supabase
      .from("notes")
      .update(updatePayload)
      .eq("id", noteId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update note:", updateError);
      return Response.json({ error: "Failed to update note" }, { status: 500 });
    }

    if (updateData.markdown_content && updateData.status === "approved") {
      try {
        const { embedding } = await embed({
          model: openai.textEmbeddingModel("text-embedding-3-small"),
          value: updateData.markdown_content,
        });

        await supabase
          .from("note_embeddings")
          .upsert({
            note_id: noteId,
            embedding: JSON.stringify(embedding),
          })
          .eq("note_id", noteId);
      } catch (embeddingError) {
        console.error("Failed to generate embedding:", embeddingError);
      }
    }

    return Response.json({ note: updatedNote });
  } catch (error) {
    console.error("PATCH /api/notes/[noteId] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: existingNote, error: fetchError } = await supabase
      .from("notes")
      .select("id, practitioner_id")
      .eq("id", noteId)
      .single();

    if (fetchError || !existingNote) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    if (existingNote.practitioner_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("notes")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", noteId);

    if (deleteError) {
      console.error("Failed to delete note:", deleteError);
      return Response.json({ error: "Failed to delete note" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/notes/[noteId] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
