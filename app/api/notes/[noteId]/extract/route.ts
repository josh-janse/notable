import type { NextRequest } from "next/server";
import { z } from "zod";
import { extractNoteFields } from "@/lib/ai/extract-note-fields";
import { createClient } from "@/lib/supabase/server";

const extractRequestSchema = z.object({
  transcription: z.string().min(1, "Transcription is required"),
  templateId: z.string().uuid("Invalid template ID"),
});

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
    const validationResult = extractRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return Response.json(
        { error: "Invalid request", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { transcription, templateId } = validationResult.data;

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

    const { data: template, error: templateError } = await supabase
      .from("note_templates")
      .select("name, structure")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    if (
      !template.structure ||
      typeof template.structure !== "object" ||
      !("sections" in template.structure)
    ) {
      return Response.json(
        { error: "Invalid template structure" },
        { status: 400 }
      );
    }

    const result = await extractNoteFields({
      transcription,
      templateId,
      templateName: template.name,
      templateStructure: template.structure as {
        headers?: Array<{
          level: number;
          text: string;
          locked?: boolean;
        }>;
        sections: Array<{
          title: string;
          placeholder?: string;
          required?: boolean;
        }>;
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Extraction error:", error);
    return Response.json(
      {
        error: "Extraction failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
