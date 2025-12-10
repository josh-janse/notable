/**
 * Individual Client API Route Handler
 *
 * GET /api/clients/[clientId] - Get client details with aggregated stats
 * PATCH /api/clients/[clientId] - Update client information
 * DELETE /api/clients/[clientId] - Soft delete (archive) client
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";
import { updateClientSchema } from "@/lib/validations/client";

type Client = Database["public"]["Tables"]["clients"]["Row"];

/**
 * GET /api/clients/[clientId]
 * Retrieve client details with aggregated statistics
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const supabase = await createClient();
    const { clientId } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch client with RLS enforcing practitioner ownership
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .eq("practitioner_id", user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch aggregated statistics
    // Get total notes count
    const { count: totalNotes } = await supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId);

    // Get total assessments count
    const { count: totalAssessments } = await supabase
      .from("assessment_results")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId);

    // Get last session date from most recent note
    const { data: lastNote } = await supabase
      .from("notes")
      .select("session_date")
      .eq("client_id", clientId)
      .not("session_date", "is", null)
      .order("session_date", { ascending: false })
      .limit(1)
      .single();

    // Return client with aggregated stats
    return NextResponse.json({
      ...client,
      total_notes: totalNotes || 0,
      total_assessments: totalAssessments || 0,
      last_session_date: lastNote?.session_date || null,
    } as Client & {
      total_notes: number;
      total_assessments: number;
      last_session_date: string | null;
    });
  } catch (error) {
    console.error("Error in GET /api/clients/[clientId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/clients/[clientId]
 * Update client information
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Route handler logic is complex
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const supabase = await createClient();
    const { clientId } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateClientSchema.parse(body);

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.full_name !== undefined) {
      updateData.full_name = validatedData.full_name;
    }
    if (validatedData.email !== undefined) {
      updateData.email = validatedData.email;
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone;
    }
    if (validatedData.date_of_birth !== undefined) {
      updateData.date_of_birth = validatedData.date_of_birth
        ? new Date(validatedData.date_of_birth).toISOString()
        : null;
    }
    if (validatedData.initial_assessment_date !== undefined) {
      updateData.initial_assessment_date = validatedData.initial_assessment_date
        ? new Date(validatedData.initial_assessment_date).toISOString()
        : null;
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }
    if (validatedData.notes_summary !== undefined) {
      updateData.notes_summary = validatedData.notes_summary;
    }
    if (validatedData.metadata !== undefined) {
      updateData.metadata = validatedData.metadata;
    }

    // Update client (RLS enforces practitioner ownership)
    const { data: client, error } = await supabase
      .from("clients")
      .update(updateData)
      .eq("id", clientId)
      .eq("practitioner_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating client:", error);
      return NextResponse.json(
        { error: "Failed to update client" },
        { status: 500 }
      );
    }

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error in PATCH /api/clients/[clientId]:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request body", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[clientId]
 * Soft delete (archive) a client by setting archived_at timestamp
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const supabase = await createClient();
    const { clientId } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Soft delete: set archived_at timestamp
    const { data: client, error } = await supabase
      .from("clients")
      .update({
        archived_at: new Date().toISOString(),
        status: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)
      .eq("practitioner_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error archiving client:", error);
      return NextResponse.json(
        { error: "Failed to archive client" },
        { status: 500 }
      );
    }

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, client });
  } catch (error) {
    console.error("Error in DELETE /api/clients/[clientId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
