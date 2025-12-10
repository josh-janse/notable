import type { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";

const createNoteSchema = z.object({
  client_id: z.string().uuid("Invalid client ID"),
  template_id: z.string().uuid("Invalid template ID").optional(),
  markdown_content: z.string().optional(),
  raw_transcription: z.string().optional(),
  extracted_fields: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["draft", "completed", "approved"]).default("draft"),
  session_date: z.string().datetime().optional(),
  duration_minutes: z.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("client_id");
    const status = searchParams.get("status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

    let query = supabase
      .from("notes")
      .select(
        `
        *,
        client:clients!notes_client_id_fkey(id, full_name),
        note_template:note_templates!notes_template_id_fkey(id, name)
      `,
        { count: "exact" }
      )
      .eq("practitioner_id", user.id)
      .order("session_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (startDate) {
      query = query.gte("session_date", startDate);
    }

    if (endDate) {
      query = query.lte("session_date", endDate);
    }

    const { data: notes, error, count } = await query;

    if (error) {
      console.error("Failed to fetch notes:", error);
      return Response.json({ error: "Failed to fetch notes" }, { status: 500 });
    }

    return Response.json({
      notes,
      count,
      offset,
      limit,
    });
  } catch (error) {
    console.error("GET /api/notes error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createNoteSchema.safeParse(body);

    if (!validationResult.success) {
      return Response.json(
        {
          error: "Invalid request",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const noteData = validationResult.data;

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, practitioner_id")
      .eq("id", noteData.client_id)
      .single();

    if (clientError || !client) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    if (client.practitioner_id !== user.id) {
      return Response.json(
        { error: "Cannot create note for another practitioner's client" },
        { status: 403 }
      );
    }

    if (noteData.template_id) {
      const { data: template, error: templateError } = await supabase
        .from("note_templates")
        .select("id")
        .eq("id", noteData.template_id)
        .single();

      if (templateError || !template) {
        return Response.json({ error: "Template not found" }, { status: 404 });
      }
    }

    const { data: note, error: insertError } = await supabase
      .from("notes")
      .insert({
        practitioner_id: user.id,
        client_id: noteData.client_id,
        template_id: noteData.template_id,
        markdown_content: noteData.markdown_content,
        raw_transcription: noteData.raw_transcription,
        extracted_fields:
          noteData.extracted_fields as Database["public"]["Tables"]["notes"]["Insert"]["extracted_fields"],
        status: noteData.status,
        session_date: noteData.session_date,
        duration_minutes: noteData.duration_minutes,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create note:", insertError);
      return Response.json({ error: "Failed to create note" }, { status: 500 });
    }

    return Response.json({ note }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
