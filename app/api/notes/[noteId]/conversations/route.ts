import type { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
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

    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("id, practitioner_id")
      .eq("id", noteId)
      .single();

    if (noteError || !note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.practitioner_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: conversations, error } = await supabase
      .from("note_conversations")
      .select("*")
      .eq("note_id", noteId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch conversations:", error);
      return Response.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      );
    }

    return Response.json({ conversations });
  } catch (error) {
    console.error("GET /api/notes/[noteId]/conversations error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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
    const validationResult = conversationMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return Response.json(
        {
          error: "Invalid request",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { role, content } = validationResult.data;

    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("id, practitioner_id")
      .eq("id", noteId)
      .single();

    if (noteError || !note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.practitioner_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: conversation, error: insertError } = await supabase
      .from("note_conversations")
      .insert({
        note_id: noteId,
        role,
        content,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create conversation message:", insertError);
      return Response.json(
        { error: "Failed to create conversation message" },
        { status: 500 }
      );
    }

    return Response.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes/[noteId]/conversations error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
